package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.finovex.dto.response.UnitResponse;
import com.finovex.entity.Unit;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.repository.UnitRepository;

@ExtendWith(MockitoExtension.class)
class UnitManagerImplTest {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	@Mock
	private UnitRepository unitRepository;

	private UnitManagerImpl unitManager;

	@BeforeEach
	void setUp() {
		this.unitManager = new UnitManagerImpl(this.unitRepository);
	}

	@Test
	void findUsableListsTheApprovedUnitsInOrder() {
		when(this.unitRepository.findByStatusOrderByUnitSeq(APPROVED))
			.thenReturn(List.of(unit(1, "PCS", "Piece"), unit(2, "KG", "Kilogram")));

		assertThat(this.unitManager.findUsable()).containsExactly(new UnitResponse("1", "PCS", "Piece"),
				new UnitResponse("2", "KG", "Kilogram"));
	}

	@Test
	void usableUnitReturnsTheApprovedUnit() {
		Unit kg = unit(2, "KG", "Kilogram");
		when(this.unitRepository.findByUnitSeqAndStatus(2, APPROVED)).thenReturn(Optional.of(kg));

		assertThat(this.unitManager.usableUnit(" 2 ")).isSameAs(kg);
	}

	@Test
	void usableUnitRejectsAMissingOrUnapprovedUnit() {
		when(this.unitRepository.findByUnitSeqAndStatus(99, APPROVED)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> this.unitManager.usableUnit("99"))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR);
				assertThat(ex.getFieldErrors()).containsEntry("unitId", List.of("Choose a unit"));
			});
	}

	private static Unit unit(Integer unitSeq, String unitCode, String unitName) {
		Unit unit = new Unit();
		unit.setUnitSeq(unitSeq);
		unit.setUnitCode(unitCode);
		unit.setUnitName(unitName);
		unit.setStatus(APPROVED);
		return unit;
	}

}
