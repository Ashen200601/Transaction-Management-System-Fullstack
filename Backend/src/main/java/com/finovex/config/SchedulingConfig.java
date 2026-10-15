package com.finovex.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Runs the @Scheduled jobs, e.g. {@code ExpiredSessionCleanup}. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
