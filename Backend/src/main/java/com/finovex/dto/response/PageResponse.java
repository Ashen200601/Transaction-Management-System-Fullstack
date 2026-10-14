package com.finovex.dto.response;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * One page of a list endpoint, as the frontend's {@code Paginated<T>}. Pages count from 1
 * here, while Spring Data counts from 0; {@link #of} converts.
 *
 * <pre>{@code
 * Page<Product> page = productRepository.findAll(PageRequest.of(pageNumber - 1, pageSize));
 * return PageResponse.of(page, ProductMapper::toResponse);
 * }</pre>
 */
public record PageResponse<T>(List<T> items, int page, int pageSize, long totalItems, int totalPages) {

	public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
		return new PageResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber() + 1,
				page.getSize(), page.getTotalElements(), Math.max(1, page.getTotalPages()));
	}

}
