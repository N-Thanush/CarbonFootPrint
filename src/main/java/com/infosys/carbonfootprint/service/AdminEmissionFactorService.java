package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.EmissionFactorRequest;
import com.infosys.carbonfootprint.dto.EmissionFactorResponse;
import com.infosys.carbonfootprint.entity.ActivityType;
import com.infosys.carbonfootprint.entity.EmissionFactor;
import com.infosys.carbonfootprint.repository.ActivityTypeRepository;
import com.infosys.carbonfootprint.repository.EmissionFactorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminEmissionFactorService {

    private final EmissionFactorRepository emissionFactorRepository;
    private final ActivityTypeRepository activityTypeRepository;

    public AdminEmissionFactorService(EmissionFactorRepository emissionFactorRepository,
                                       ActivityTypeRepository activityTypeRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
        this.activityTypeRepository = activityTypeRepository;
    }

    public Page<EmissionFactorResponse> getEmissionFactors(Long activityTypeId, Pageable pageable) {
        if (activityTypeId != null) {
            return emissionFactorRepository.findByActivityTypeId(activityTypeId, pageable).map(this::toResponse);
        }
        return emissionFactorRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public EmissionFactorResponse createEmissionFactor(EmissionFactorRequest request) {
        ActivityType activityType = activityTypeRepository.findById(request.getActivityTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + request.getActivityTypeId()));

        EmissionFactor factor = EmissionFactor.builder()
                .activityType(activityType)
                .kgCo2PerUnit(request.getKgCo2PerUnit())
                .source(request.getSource() != null ? request.getSource().trim() : "Custom")
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        factor = emissionFactorRepository.save(factor);
        return toResponse(factor);
    }

    @Transactional
    public EmissionFactorResponse updateEmissionFactor(Long id, EmissionFactorRequest request) {
        EmissionFactor factor = emissionFactorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Emission factor not found with ID: " + id));

        ActivityType activityType = activityTypeRepository.findById(request.getActivityTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + request.getActivityTypeId()));

        factor.setActivityType(activityType);
        factor.setKgCo2PerUnit(request.getKgCo2PerUnit());
        if (request.getSource() != null) factor.setSource(request.getSource().trim());
        factor.setEffectiveFrom(request.getEffectiveFrom());
        factor.setEffectiveTo(request.getEffectiveTo());
        if (request.getActive() != null) factor.setActive(request.getActive());

        factor = emissionFactorRepository.save(factor);
        return toResponse(factor);
    }

    @Transactional
    public ApiResponse deleteEmissionFactor(Long id) {
        EmissionFactor factor = emissionFactorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Emission factor not found with ID: " + id));
        factor.setActive(false);
        emissionFactorRepository.save(factor);
        return ApiResponse.success("Emission factor deactivated successfully");
    }

    private EmissionFactorResponse toResponse(EmissionFactor ef) {
        return EmissionFactorResponse.builder()
                .id(ef.getId())
                .activityTypeId(ef.getActivityType().getId())
                .activityTypeName(ef.getActivityType().getName())
                .categoryName(ef.getActivityType().getCategory().getName())
                .unit(ef.getActivityType().getUnit())
                .kgCo2PerUnit(ef.getKgCo2PerUnit())
                .source(ef.getSource())
                .effectiveFrom(ef.getEffectiveFrom())
                .effectiveTo(ef.getEffectiveTo())
                .active(ef.getActive())
                .createdAt(ef.getCreatedAt())
                .build();
    }
}
