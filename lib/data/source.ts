/**
 * Data source switch used while the storefront is redesigned ahead of the
 * backend rebuild. Set DATA_SOURCE=mock to render the storefront from local
 * fixtures (no database needed); anything else uses the live database.
 */
export const isMockData = process.env.DATA_SOURCE === "mock";
