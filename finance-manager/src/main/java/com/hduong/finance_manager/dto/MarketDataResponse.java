package com.hduong.finance_manager.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketDataResponse {

    /** Ticker symbol: BTC, ETH, GOLD, USD_VND, RON95, etc. */
    private String symbol;

    /** Human-readable name: Bitcoin, Gold / Troy Oz, USD / VND, etc. */
    private String name;

    /** One of: CRYPTO, FOREX, COMMODITY, FUEL, STOCK */
    private String category;

    /** Emoji or icon identifier shown in the UI. */
    private String icon;

    /** Current price in the given currency. */
    private double price;

    /** ISO currency code: USD or VND. */
    private String currency;

    /** Percentage price change over the last 24 hours. */
    private double change24h;

    private double high24h;
    private double low24h;

    /** 24-hour trading volume (null for non-traded instruments like fuel). */
    private Long volume24h;

    /** Up to 20 price points for a mini sparkline chart. */
    private List<Double> sparkline;

    private LocalDateTime updatedAt;

    /** Data source identifier: coingecko, open.er-api, metals.live, fallback, etc. */
    private String source;
}
