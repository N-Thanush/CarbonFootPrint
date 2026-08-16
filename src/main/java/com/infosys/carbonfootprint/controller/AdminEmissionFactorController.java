package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.EmissionFactorRequest;
import com.infosys.carbonfootprint.dto.EmissionFactorResponse;
import com.infosys.carbonfootprint.service.AdminEmissionFactorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/emission-factors")
public class AdminEmissionFactorController {

    private final AdminEmissionFactorService emissionFactorService;

    public AdminEmissionFactorController(AdminEmissionFactorService emissionFactorService) {
        this.emissionFactorService = emissionFactorService;
    }

    @GetMapping
    public ResponseEntity<Page<EmissionFactorResponse>> getEmissionFactors(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long activityTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("id").descending());
        return ResponseEntity.ok(emissionFactorService.getEmissionFactors(categoryId, activityTypeId, pageRequest));
    }

    @PostMapping
    public ResponseEntity<EmissionFactorResponse> createEmissionFactor(@Valid @RequestBody EmissionFactorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emissionFactorService.createEmissionFactor(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmissionFactorResponse> updateEmissionFactor(@PathVariable Long id, @Valid @RequestBody EmissionFactorRequest request) {
        return ResponseEntity.ok(emissionFactorService.updateEmissionFactor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteEmissionFactor(@PathVariable Long id) {
        return ResponseEntity.ok(emissionFactorService.deleteEmissionFactor(id));
    }
}
