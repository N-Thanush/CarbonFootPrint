package com.infosys.carbonfootprint.config;

import com.infosys.carbonfootprint.entity.*;
import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.enums.AuthProvider;
import com.infosys.carbonfootprint.enums.DocumentType;
import com.infosys.carbonfootprint.enums.Role;
import com.infosys.carbonfootprint.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

/**
 * Seeds the database with default admin account, categories, activity types, emission factors, and badges on startup.
 */
@Configuration
public class DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    public CommandLineRunner seedDatabase(UserRepository userRepository,
                                         PasswordEncoder passwordEncoder,
                                         ActivityCategoryRepository categoryRepository,
                                         ActivityTypeRepository typeRepository,
                                         EmissionFactorRepository factorRepository,
                                         BadgeRepository badgeRepository) {
        return args -> {
            // 1. Seed Default Admin
            seedAdmin(userRepository, passwordEncoder);

            // 2. Seed Categories, Activity Types & Emission Factors
            if (categoryRepository.count() == 0) {
                logger.info("Seeding initial categories, activity types, and emission factors...");
                seedCategoriesAndFactors(categoryRepository, typeRepository, factorRepository);
            }

            // 3. Seed Badges
            if (badgeRepository.count() == 0) {
                logger.info("Seeding initial badges...");
                seedBadges(badgeRepository);
            }
        };
    }

    private void seedAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        String adminEmail = "admin@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .fullName("System Administrator")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .phone("0000000000")
                    .dateOfBirth(LocalDate.of(2000, 1, 1))
                    .address("System Administrator HQ")
                    .country("India")
                    .state("Karnataka")
                    .documentType(DocumentType.PAN)
                    .documentNumber("ADMIN0000A")
                    .role(Role.ADMIN)
                    .accountStatus(AccountStatus.APPROVED)
                    .authProvider(AuthProvider.LOCAL)
                    .build();

            userRepository.save(admin);
            logger.info("Seeded default admin: {}", adminEmail);
        }
    }

    private void seedCategoriesAndFactors(ActivityCategoryRepository categoryRepo,
                                         ActivityTypeRepository typeRepo,
                                         EmissionFactorRepository factorRepo) {
        // --- 1. TRANSPORT ---
        ActivityCategory transport = categoryRepo.save(ActivityCategory.builder()
                .name("TRANSPORT")
                .description("Vehicle emissions from commuting, flights, and public transit")
                .iconName("car")
                .displayOrder(1)
                .build());

        seedActivityAndFactor(transport, "Car (Gasoline)", "Drive a petrol/diesel car", "km", 0.21, "EPA", typeRepo, factorRepo);
        seedActivityAndFactor(transport, "Bus", "Public bus transit", "km", 0.089, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(transport, "Train / Metro", "Electric or diesel train travel", "km", 0.041, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(transport, "Flight (Domestic)", "Short-haul domestic flight", "km", 0.255, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(transport, "Flight (International)", "Long-haul international flight", "km", 0.195, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(transport, "Bicycle / Walking", "Zero emission active transport", "km", 0.00, "IPCC", typeRepo, factorRepo);

        // --- 2. ELECTRICITY ---
        ActivityCategory electricity = categoryRepo.save(ActivityCategory.builder()
                .name("ELECTRICITY")
                .description("Household and office electrical energy usage")
                .iconName("bolt")
                .displayOrder(2)
                .build());

        seedActivityAndFactor(electricity, "Grid Electricity", "Standard electrical grid consumption", "kWh", 0.82, "India CEA", typeRepo, factorRepo);
        seedActivityAndFactor(electricity, "Solar Energy", "Rooftop solar panels", "kWh", 0.05, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(electricity, "Diesel Generator", "Backup power generator", "kWh", 2.68, "EPA", typeRepo, factorRepo);

        // --- 3. FOOD ---
        ActivityCategory food = categoryRepo.save(ActivityCategory.builder()
                .name("FOOD")
                .description("Carbon impact of daily dietary choices")
                .iconName("utensils")
                .displayOrder(3)
                .build());

        seedActivityAndFactor(food, "Beef Meal", "Red meat serving", "serving", 6.61, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(food, "Chicken / Poultry Meal", "White meat serving", "serving", 3.35, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(food, "Vegetarian Meal", "Plant-based meal with dairy", "serving", 1.70, "IPCC", typeRepo, factorRepo);
        seedActivityAndFactor(food, "Vegan Meal", "Strictly plant-based meal", "serving", 0.90, "IPCC", typeRepo, factorRepo);

        // --- 4. SHOPPING ---
        ActivityCategory shopping = categoryRepo.save(ActivityCategory.builder()
                .name("SHOPPING")
                .description("Emissions embedded in consumer goods and purchases")
                .iconName("shopping-bag")
                .displayOrder(4)
                .build());

        seedActivityAndFactor(shopping, "Clothing / Apparel", "New clothes purchase", "item", 10.0, "WRAP", typeRepo, factorRepo);
        seedActivityAndFactor(shopping, "Electronics", "Gadgets, phones, laptops", "item", 50.0, "EPA", typeRepo, factorRepo);
        seedActivityAndFactor(shopping, "Groceries", "General household grocery purchase", "kg", 1.50, "IPCC", typeRepo, factorRepo);
    }

    private void seedActivityAndFactor(ActivityCategory category, String name, String desc, String unit,
                                       double kgCo2, String source,
                                       ActivityTypeRepository typeRepo, EmissionFactorRepository factorRepo) {
        ActivityType type = typeRepo.save(ActivityType.builder()
                .category(category)
                .name(name)
                .description(desc)
                .unit(unit)
                .active(true)
                .build());

        factorRepo.save(EmissionFactor.builder()
                .activityType(type)
                .kgCo2PerUnit(kgCo2)
                .source(source)
                .effectiveFrom(LocalDate.of(2026, 1, 1))
                .active(true)
                .build());
    }

    private void seedBadges(BadgeRepository badgeRepo) {
        List<Badge> badges = List.of(
                Badge.builder().name("First Steps").description("Logged your first activity").iconName("footsteps").criteria("Log 1 activity").thresholdValue(1.0).build(),
                Badge.builder().name("Eco Warrior").description("Saved 10 kg of CO2").iconName("shield").criteria("Reduce 10 kg CO2").thresholdValue(10.0).build(),
                Badge.builder().name("Carbon Neutral Champion").description("Saved 50 kg of CO2").iconName("award").criteria("Reduce 50 kg CO2").thresholdValue(50.0).build(),
                Badge.builder().name("Green Traveler").description("Logged 5 public transit or bike trips").iconName("bicycle").criteria("Log 5 transit activities").thresholdValue(5.0).build()
        );
        badgeRepo.saveAll(badges);
    }
}
