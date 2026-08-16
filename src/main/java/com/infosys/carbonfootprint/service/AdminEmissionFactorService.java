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

    public Page<EmissionFactorResponse> getEmissionFactors(Long categoryId, Long activityTypeId, Pageable pageable) {
        if (activityTypeId != null) {
            return emissionFactorRepository.findByActivityTypeId(activityTypeId, pageable).map(this::toResponse);
        }
        if (categoryId != null) {
            return emissionFactorRepository.findByActivityType_Category_Id(categoryId, pageable).map(this::toResponse);
        }
        return emissionFactorRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public EmissionFactorResponse createEmissionFactor(EmissionFactorRequest request) {
        ActivityType activityType = activityTypeRepository.findById(request.getActivityTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + request.getActivityTypeId()));

        String unit = request.getUnit() != null && !request.getUnit().trim().isEmpty()
                ? request.getUnit().trim()
                : activityType.getUnit();

        EmissionFactor factor = EmissionFactor.builder()
                .activityType(activityType)
                .kgCo2PerUnit(request.getKgCo2PerUnit())
                .unit(unit)
                .source(request.getSource() != null ? request.getSource().trim() : "Custom")
                .sourceVersion(request.getSourceVersion() != null ? request.getSourceVersion().trim() : "v1.0")
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .active(request.getActive() != null ? request.getActive() : true)
                .remarks(request.getRemarks() != null ? request.getRemarks().trim() : null)
                .createdBy(request.getCreatedBy() != null ? request.getCreatedBy().trim() : "ADMIN")
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
        if (request.getUnit() != null) factor.setUnit(request.getUnit().trim());
        if (request.getSource() != null) factor.setSource(request.getSource().trim());
        if (request.getSourceVersion() != null) factor.setSourceVersion(request.getSourceVersion().trim());
        factor.setEffectiveFrom(request.getEffectiveFrom());
        factor.setEffectiveTo(request.getEffectiveTo());
        if (request.getActive() != null) factor.setActive(request.getActive());
        if (request.getRemarks() != null) factor.setRemarks(request.getRemarks().trim());
        factor.setUpdatedBy("ADMIN");

        factor = emissionFactorRepository.save(factor);
        return toResponse(factor);
    }

    @Transactional
    public ApiResponse deleteEmissionFactor(Long id) {
        EmissionFactor factor = emissionFactorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Emission factor not found with ID: " + id));
        factor.setActive(false);
        factor.setUpdatedBy("ADMIN");
        emissionFactorRepository.save(factor);
        return ApiResponse.success("Emission factor deactivated successfully");
    }

    private EmissionFactorResponse toResponse(EmissionFactor ef) {
        String unit = ef.getUnit() != null ? ef.getUnit() : ef.getActivityType().getUnit();
        return EmissionFactorResponse.builder()
                .id(ef.getId())
                .categoryId(ef.getActivityType().getCategory() != null ? ef.getActivityType().getCategory().getId() : null)
                .activityTypeId(ef.getActivityType().getId())
                .activityTypeName(ef.getActivityType().getName())
                .categoryName(ef.getActivityType().getCategory().getName())
                .unit(unit)
                .kgCo2PerUnit(ef.getKgCo2PerUnit())
                .source(ef.getSource())
                .sourceVersion(ef.getSourceVersion())
                .effectiveFrom(ef.getEffectiveFrom())
                .effectiveTo(ef.getEffectiveTo())
                .active(ef.getActive())
                .remarks(ef.getRemarks())
                .createdBy(ef.getCreatedBy())
                .updatedBy(ef.getUpdatedBy())
                .createdAt(ef.getCreatedAt())
                .updatedAt(ef.getUpdatedAt())
                .build();
    }
}
