package com.finovex;

import org.springframework.boot.SpringApplication;

/**
 * Runs the API against a throwaway PostgreSQL in Docker, without compose.yaml:
 * {@code ./mvnw spring-boot:test-run}. Data is lost when it stops.
 */
public class TestFinovexApplication {

	public static void main(String[] args) {
		SpringApplication.from(FinovexApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
