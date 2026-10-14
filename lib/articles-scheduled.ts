// Articles written ahead, one per day. Each stays hidden until its
// `published` day (publishedArticles filters by date), so a week goes out
// one a day with a single deploy. Same rules as lib/articles: every outside
// fact links to its source, no invented numbers, no promises of rankings,
// no competitors named. Byline "SaySites".

import type { Article } from './articles'

const LOCAL_RANKING = 'https://support.google.com/business/answer/7091'
const REVIEW_TIPS = 'https://support.google.com/business/answer/3474122'
const MAPS_POLICY = 'https://support.google.com/contributionpolicy/answer/7400114'
const SERVICE_AREAS = 'https://support.google.com/business/answer/9157481'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const TITLE_LINKS = 'https://developers.google.com/search/docs/appearance/title-link'
const SNIPPETS = 'https://developers.google.com/search/docs/appearance/snippet'
const WEB_VITALS = 'https://web.dev/articles/vitals'
const HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const PAGESPEED = 'https://pagespeed.web.dev/'
const SPAM = 'https://developers.google.com/search/docs/essentials/spam-policies'
const HREFLANG = 'https://developers.google.com/search/docs/specialty/international/localized-versions'
const LOCAL_SD = 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const ADA_WEB = 'https://www.ada.gov/resources/web-guidance/'
const SCHEMA_DENTIST = 'https://schema.org/Dentist'
const FB_FILING = 'https://www.floridabar.org/ethics/etad/advertising-filing-requirements/'
const FB_RULES = 'https://www.floridabar.org/rules/rrtfb/'
const FB_CERT = 'https://www.floridabar.org/about/cert/resources/talking-points-for-promoting-board-certification/'
const CENSUS_MIAMI = 'https://www.census.gov/quickfacts/miamidadecountyflorida'
const CENSUS_HARRIS = 'https://www.census.gov/quickfacts/harriscountytexas'
const TX_NAMES = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-52'
const TX_SPECIALTY = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-54'
const TX_GENERAL = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-55'
const TX_MISLEADING = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-57'
const TX_WEBSITE = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-59'
const TX_RECORDS = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-60'

const NY_ORDER = 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Signed%20Letter%20to%20DOS-Joint%20Order.pdf'
const NY_75 = 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Joint%20Order%20Rule%207.5.pdf'
const NYSBA_AMEND = 'https://nysba.org/amendments-adopted-to-advertising-rules/'
const NYSBA_PDF = 'https://nysba.org/wp-content/uploads/2026/08/The-Amendments-to-the-Advertising-Rules.pdf'
const NY_CIVIL = 'https://www.nycourts.gov/new-york-city-civil-court/nyc-civil-courts-county'
const NY_COURTS = 'https://www.nycourts.gov/CTAPPs/outline.htm'
const CENSUS_NYC = 'https://www.census.gov/quickfacts/fact/table/newyorkcitynewyork/PST045225'
const GOOGLE_AI = 'https://developers.google.com/search/docs/appearance/ai-features'
const ARS_1124 = 'https://www.azleg.gov/ars/32/01124.htm'
const ROC_ADS = 'https://roc.az.gov/news/changes-arizona-law-regarding-advertising-requirements-contractors'
const ROC_HOME = 'https://roc.az.gov/'
const AZ_RES = 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-9-103'
const AZ_COM = 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-9-102'
const AZ_DUAL = 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-9-104'
const NWS_PHX = 'https://www.weather.gov/psr/ExtremeTemps'
const CENSUS_PHX = 'https://www.census.gov/quickfacts/fact/table/phoenixcityarizona,maricopacountyarizona/PST045225'
const PHX_COOLING = 'https://www.phoenix.gov/content/dam/phoenix/heatsite/documents/6-3-22%20Cooling%20Ordinance%20Flyer%20English%20and%20Spanish_-combined.pdf'
const SCHEMA_HVAC = 'https://schema.org/HVACBusiness'
const CA_CH7 = 'https://www.calbar.ca.gov/legal-professionals/rules/rules-professional-conduct/current-rules-professional-conduct/chapter-7-information-about-legal-services'
const CA_RRC_71 = 'https://www.calbar.ca.gov/sites/default/files/portals/0/documents/rules/rrc2014/final_rules/rrc2-7.1_%5B1-400%5D-all.pdf'
const CA_1400 = 'https://www.calbar.ca.gov/legal-professionals/rules/rules-professional-conduct/previous-rules-professional-conduct/rule-1-400-advertising-and-solicitation'
const CA_OP_2001 = 'https://www.calbar.ca.gov/sites/default/files/portals/0/documents/ethics/Opinions/2001-155.htm'
const CA_SPEC_AREAS = 'https://www.calbar.ca.gov/legal-professionals/legal-specialization/legal-specialty-areas'
const CA_SPEC_FIND = 'https://www.calbar.ca.gov/public/find-legal-professionals/find-certified-specialist'
const CA_BAR_DEMO = 'https://apps.calbar.ca.gov/members/demographics.aspx'
const CA_BAR_COUNTIES = 'https://apps.calbar.ca.gov/members/demographics_counties.aspx'
const CA_GENAI = 'https://www.calbar.ca.gov/sites/default/files/portals/0/documents/ethics/Generative-AI-Practical-Guidance.pdf'
const CA_DVRO = 'https://newsroom.courts.ca.gov/news/california-supreme-court-amends-rules-professional-conduct'
const BPC_6157 = 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6157'
const BPC_6157_2 = 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6157.2'
const BPC_6158 = 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6158'
const BPC_6159_1 = 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6159.1'
const LASC_RELEASE = 'https://www.lacourt.org/newsmedia/uploads/14202699134019NR-09-09-2026-PresidingJudge-AssistantPresidingJudge.pdf'
const CACD_PROFILE = 'https://www.cacd.uscourts.gov/sites/default/files/documents/2020%20Central%20District%20of%20California%20Profile.pdf'
const CENSUS_LA = 'https://www.census.gov/quickfacts/fact/table/losangelescountycalifornia,losangelescitycalifornia/PST045224'
const ILCS_5 = 'https://ilga.gov/legislation/ilcs/documents/022503200K5.htm'
const ILCS_3 = 'https://ilga.gov/legislation/ilcs/documents/022503200K3.htm'
const ILCS_13_1 = 'https://www.ilga.gov/Documents/legislation/ilcs/documents/022503200K13.1.htm'
const IDPH_PLUMB = 'https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html'
const CHI_PL = 'https://chicago.gov/city/en/depts/bldgs/supp_info/TLdetails/PLcontractor.html'
const CHI_DWM = 'https://www.chicago.gov/content/dam/city/depts/obm/supp_info/2025Budget/2025BudgetOpeningStatements/Department%20Hearing%20Opening%20Statement%20DWM.pdf'
const CHI_CCR_2023 = 'https://www.chicago.gov/content/dam/city/depts/water/ConsumerConfidenceReports/2023_WaterQualityReport_CCR.pdf'
const CHI_CCR_2024 = 'https://www.chicago.gov/content/dam/city/depts/water/ConsumerConfidenceReports/2024_WaterQuality%20Report_CCR.pdf'
const IL_LSL_ACT = 'https://www.ilga.gov/Documents/legislation/ilcs/documents/041500050K17.12.htm'
const IDPH_LSL = 'https://dph.illinois.gov/topics-services/environmental-health-protection/lead-in-water/lead-service-lines/lead-service-line-replacements.html'
const CHI_FLOOD = 'https://www.chicago.gov/city/en/depts/water/supp_info/basement_floodingpartnership.html'
const MWRD_GUIDE = 'https://www.mwrd.org/sites/default/files/2025-10/Flood_Resource_Guide_251027.pdf'
const NWS_NORMALS = 'https://www.weather.gov/lot/ord_rfd_monthly_yearly_normals'
const NWS_2019 = 'https://www.weather.gov/lot/RecordColdJan2019'
const NWS_RECORDS = 'https://www.weather.gov/lot/Chicago_Temperature_Records'
const CENSUS_CHI = 'https://www.census.gov/quickfacts/fact/table/chicagocityillinois,cookcountyillinois/POP010210'
const CENSUS_COOK = 'https://www.census.gov/quickfacts/fact/table/cookcountyillinois,IL/PST045222'

const TX_RULES = 'https://www.texasbar.com/Content/NavigationMenu/ForLawyers/AdvertisingReview/ADRULES2023.pdf'
const TX_ADREVIEW = 'https://www.texasbar.com/AM/Template.cfm?Section=Advertising_Review&Template=/CM/HTMLDisplay.cfm&ContentID=60143'
const TX_FAQ = 'https://www.texasbar.com/AM/Template.cfm?Section=Advertising_Review&Template=/CM/ContentDisplay.cfm&ContentID=53939'
const TX_ORDER = 'https://www.txcourts.gov/media/1453538/229011.pdf'
const TX_HARRIS_ATTY = 'https://www.texasbar.com/AM/Template.cfm?Section=Demographic_and_Economic_Trends&Template=/CM/ContentDisplay.cfm&ContentID=71546'
const PC_3812 = 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.38.htm#38.12'
const GV_820651 = 'https://statutes.capitol.texas.gov/Docs/GV/htm/GV.82.htm#82.0651'
const JUSTEX = 'https://www.justex.net/'
const JUSTEX_NEW = 'https://www.justex.net/dca/JustexDocuments/0/News%20Items/News%202026/Three%20New%20Civil%20District%20Courts%20Opened%20Sept%201%20as%20Part%20of%20Harris%20County%20Judicial%20Expansion.pdf'
const TXS_HOU = 'https://www.txs.uscourts.gov/offices/houston-division'
const CENSUS_HOU = 'https://www.census.gov/quickfacts/fact/table/houstoncitytexas,harriscountytexas/PST045224'
const CRS6 = 'https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-06.pdf'
const CRS_102 = 'https://colorado.public.law/statutes/crs_6-22-102'
const CRS_103 = 'https://colorado.public.law/statutes/crs_6-22-103'
const CRS_104 = 'https://colorado.public.law/statutes/crs_6-22-104'
const CRS_105 = 'https://colorado.public.law/statutes/crs_6-22-105'
const COAG_2019 = 'https://coag.gov/press-releases/8-22-19-2'
const COAG_ALERT = 'https://coag.gov/app/uploads/2020/10/FINAL-Oct-2020-home-repair-fraud-consumer-alert.pdf'
const STOPFRAUD = 'https://stopfraudcolorado.gov/fraud-center/contractor-fraud/'
const DEN_LICENSE = 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development/Contractor-Licensing/Contractor-Licenses/Apply-for-a-Contractor-License'
const DEN_CLASSD = 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development/Contractor-Licensing/Supervisor-Certificates/Specialty-Class-D-Certificates'
const DEN_ROOF_GUIDE = 'https://www.denvergov.org/files/assets/public/v/4/community-planning-and-development/documents/ds/inspections/roofing_guidelines_and_checklist.pdf'
const DOI_2024 = 'https://doi.colorado.gov/news-releases-consumer-advisories/consumer-advisory-division-of-insurance-shares-tips-after'
const DOI_2025 = 'https://doi.colorado.gov/news-releases-consumer-advisories/consumer-advisory-division-of-insurance-shares-tips-to-prepare'
const NWS_2017 = 'https://www.weather.gov/bou/SevereWeatherReport8May2017'
const NWS_GLD = 'https://www.weather.gov/gld/ColoradoSevereWeatherAwarenessWeek'
const CSU_HAIL = 'https://newsmediarelations.colostate.edu/inthenews/when-is-hail-season-in-colorado/'
const CENSUS_DEN = 'https://www.census.gov/quickfacts/fact/table/denvercitycolorado/POP060210'
const LSA_US = 'https://support.google.com/localservices/answer/12174778?hl=en&co=GENIE.CountryCode%3DUS'

const PRODUCT_SD = 'https://developers.google.com/search/docs/appearance/structured-data/product'
const MERCHANT_SD = 'https://developers.google.com/search/docs/appearance/structured-data/merchant-listing'
const VARIANTS_SD = 'https://developers.google.com/search/docs/appearance/structured-data/product-variants'
const REVIEW_SD = 'https://developers.google.com/search/docs/appearance/structured-data/review-snippet'
const FREE_LISTINGS = 'https://support.google.com/merchants/answer/13889434'
const LOCAL_LISTINGS = 'https://support.google.com/merchants/answer/9825611'
const ROBOTS_META = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
const RETURN_SD = 'https://developers.google.com/search/docs/appearance/structured-data/return-policy'
const SHIPPING_SD = 'https://developers.google.com/search/docs/appearance/structured-data/shipping-policy'
const FTC_MAIL = 'https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule'

export const SCHEDULED_ARTICLES: Article[] = [
  {
    slug: 'product-structured-data-small-shops',
    title: 'Product Structured Data: Product Pages Google Can Show',
    description: 'How Google reads a product page: product snippets vs merchant listings, the required markup, photos, descriptions, variants, stock and honest reviews.',
    kind: 'guide',
    summary: [
      'Google has two kinds of product results: product snippets for pages where people can’t buy, and merchant listings for pages where a shopper can buy from you.',
      'Merchant listings need a product name, an image and an Offer, and the price must be greater than zero, with the currency in three-letter form.',
      'Give each product its own page with real photos, a description you wrote, the current stock status and, for options like size or color, one page that can preselect each choice.',
      'Mark up reviews only if they are real, shown on the page and about that product; Google’s rules forbid fake and undisclosed incentivized reviews.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=75', alt: 'Handmade speckled stoneware cups in cream and white, one with an amber glazed base, lined up on a white shelf' },
    body: `When someone searches for a thing they want to buy, Google can show more than a blue link. A product result can carry the price, whether it’s in stock, star ratings, shipping and return details, and a photo. Whether your shop’s pages can appear that way depends mostly on two things you control: how each product page is built, and the structured data that describes it.

This guide walks through what Google’s own documentation says a product page needs, in plain words. It covers the two kinds of product results, the properties that are required, photos, descriptions, product options like size and color, stock status and reviews. It ends with a checklist you can work through one product at a time. No one can promise Google will show any rich result for your pages, and Google says so too ([merchant listing documentation](${MERCHANT_SD})). What you can do is make every page eligible and accurate.

## What is product structured data?

Structured data is a short block of code on a page that describes its content in a standard vocabulary, so a search engine doesn’t have to guess. For a product page, it says “this is a product, this is its name, this is its photo, this is the price, this is the currency, and it’s in stock.” Google reads that code alongside the visible page.

Google’s product documentation describes several places this information can be used: product results in Search, annotated product images in Google Images, and other shopping experiences. It also says the more of the documented properties you add, the more enhancements a page can be eligible for ([Google product structured data](${PRODUCT_SD})).

The rule underneath all of it is simple: the markup has to describe what a shopper actually sees on the page. A price in the code that doesn’t match the price on the page, or a “Product” label on a category page full of different things, is a mismatch rather than an improvement.

## Product snippets vs merchant listings: which applies to you?

Google splits product markup into two uses, and the difference is whether a person can buy on the page ([Google product structured data](${PRODUCT_SD})):

- **Product snippets** are for pages where people can’t buy the product directly, such as an editorial review or a comparison article. This markup has more room for review details, like pros and cons.
- **Merchant listings** are for pages where customers can purchase from you. This markup has more room for detailed product information, like apparel sizing, shipping details and return policy.

Google’s merchant listing guide is direct about it: only pages where a shopper can purchase a product are eligible for merchant listing experiences ([merchant listing documentation](${MERCHANT_SD})). A page that only says “call us to order” or “available in store” is a product snippet page, not a merchant listing page.

There’s a useful overlap. Google notes that adding the required properties for merchant listings means your product pages can also be eligible for product snippets ([Google product structured data](${PRODUCT_SD})). So if you sell online, build for merchant listings and you cover both.

## One product, one page

Google’s merchant listing guidelines say product rich results only support pages that focus on a single product, or on multiple variants of the same product ([merchant listing documentation](${MERCHANT_SD})). A “Mugs” page showing twenty different mugs is a category page. It’s useful for browsing, but it is not what product results are built from.

For a small shop this has a practical meaning: every product you want people to find in Search deserves its own page, with its own address, its own photos and its own description. The category page then links to each product page. This is also better for the shopper, who can share or bookmark the exact thing they want.

If you’re rebuilding an old shop and aren’t sure your pages are set up this way, you can see a cleaner version first: [get a free redesign](/redesign) of your current site.

## The properties Google requires for merchant listings

Google’s merchant listing guide lists three properties on the Product as required ([merchant listing documentation](${MERCHANT_SD})):

1. **name:** the name of the product.
2. **image:** photos of the product. Google says pictures clearly showing the product, for example against a white background, are preferred.
3. **offers:** an Offer, because for merchant listings the merchant has to be the seller of the product.

Inside the Offer, two more are required:

- **price:** and here’s a detail that trips people up. Unlike product snippets, merchant listing experiences require a price greater than zero. A product listed at 0.00, or “free with purchase,” doesn’t qualify.
- **priceCurrency:** the currency, in three-letter ISO 4217 format, such as USD.

Then come the recommended properties. Google lists, among others ([merchant listing documentation](${MERCHANT_SD})):

- **availability:** whether the item is in stock (more on this below).
- **brand:** Google says to include at most one brand name.
- **gtin and related identifiers:** include all applicable global identifiers, such as the barcode number, if your products have them.
- **itemCondition:** the condition of the item offered for sale.
- **url:** the address of the page where a shopper can buy it.
- **shippingDetails:** your shipping policy for that offer.
- **hasMerchantReturnPolicy:** your return policy for that offer.

Shipping and returns can also be described once for the whole shop instead of on every product, which is usually easier. Google’s product documentation says merchant return policy markup belongs nested under Organization markup ([Google product structured data](${PRODUCT_SD})). That’s a topic of its own, and it’s worth getting right before you start shipping.

## Product photos Google can use

Photos are a required property, and Google gives specific guidance on them ([merchant listing documentation](${MERCHANT_SD})):

- Image addresses must be crawlable and indexable. If your photos are blocked from search engines, Google can’t use them.
- Images must represent the marked-up content. The photo has to show the product the page sells, not a mood shot of something else.
- For best results, Google recommends multiple high-resolution images, at least 50,000 pixels when you multiply width by height, in 16x9, 4x3 and 1x1 aspect ratios.

![Green suede brogue shoe resting on a pale pink box beside halved apricots, against soft pastel paper backdrops](https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1200&q=75)

What that means in practice for a small shop:

- **Shoot the product, clearly.** One photo on a plain, light background, filling most of the frame. Then add the extras that help a buyer decide: the item in use, a close-up of the material, the back or the label, something that shows scale.
- **Take the photos yourself.** A maker’s or supplier’s catalog photo may be the same one on a hundred other sites. Your own photos show the actual item you’re shipping.
- **Keep them light.** Big photos slow a page down, especially on phones. Resize before you upload, or use a site that does it for you, and check the page with a [speed test](${PAGESPEED}). Our guide to [whether your website is fast enough](/blog/is-your-website-fast-enough) explains what the numbers mean.
- **Write real alt text.** Describe what’s in the photo (“speckled stoneware mug with a pink handle”) rather than repeating the product name or stuffing keywords.

## Descriptions you wrote yourself

Google’s merchant listing guide says the description property isn’t mandatory, but it is strongly recommended ([merchant listing documentation](${MERCHANT_SD})). The bigger point is what you put in it.

Google’s guidance on helpful content asks whether a page provides original information and substantial value compared with other pages in search results, rather than simply copying or rewriting other sources ([Google on helpful content](${HELPFUL})). A description pasted from the supplier’s sheet is, by definition, the same as everyone else’s. Its spam policies also call out scaled content abuse: producing many pages mainly to rank, with little value for the reader ([Google spam policies](${SPAM})). A hundred product pages generated from a template with only the name changed fit that description.

A good small-shop product description answers the questions a person would ask if they were holding the item in your store:

- **What it is and who it’s for,** in one or two plain sentences.
- **Size and measurements,** with units, and how it compares to something familiar if that helps.
- **Materials and how it’s made,** especially if it’s handmade, local, or made in small batches.
- **Care:** washing, cleaning, what to avoid.
- **What’s in the box,** if there’s more than one piece.
- **Anything that would surprise a buyer:** natural variation in handmade items, colors that look different in daylight, a smell, a weight.

Keep the facts on the page and in the markup the same. If the page says 12 ounces and the description in the structured data says 10, one of them is wrong.

## Sizes, colors and other variants

Many products come in options: a sweater in three sizes, a candle in four scents, a print in two frame colors. Google has a separate guide for marking these up as variants of one product ([Google product variants](${VARIANTS_SD})).

The building blocks:

- **ProductGroup:** the parent product, such as “Linen apron.”
- **productGroupID:** the identifier of the group, which Google says is also known as the parent SKU.
- **variesBy:** what changes between variants. Google’s supported values are color, size, suggestedAge, suggestedGender, material and pattern.
- **hasVariant:** each individual variant, marked up as its own Product with its own details.

Google describes two ways to build the pages:

1. **One page for the whole product.** There must be only one distinct canonical address for the ProductGroup, and the site needs to be able to preselect each variant directly with a distinct address using URL query parameters. Google’s example is an address ending in ?size=small&color=green. Preselecting a variant includes showing the right image, price and availability for it.
2. **A page for each variant.** Then each page needs full and self-contained markup for what’s on that page.

For most small shops, one page per product with a size or color selector is the simpler choice, as long as choosing an option updates the photo, price and stock status that the shopper sees.

![Amber glass dropper bottle standing on a turned wooden pedestal against a pale wall striped with palm leaf shadows](https://images.unsplash.com/photo-1608571423539-e951b9b3871e?auto=format&fit=crop&w=1200&q=75)

## In stock, sold out or pre-order

Google’s product documentation says to provide availability data to help customers know when you have a product in stock ([Google product structured data](${PRODUCT_SD})). The merchant listing guide lists the values you can use, and says not to specify more than one ([merchant listing documentation](${MERCHANT_SD})):

- **InStock:** the item is in stock.
- **OutOfStock:** the item is currently out of stock.
- **SoldOut:** the item has been sold out.
- **PreOrder:** the item is available for pre-order.
- **PreSale:** available for ordering and delivery before general availability.
- **BackOrder:** the item is on back order.
- **LimitedAvailability:** the item has limited availability.
- **OnlineOnly:** available online only.
- **InStoreOnly:** only available for purchase in store.
- **Discontinued:** the item has been discontinued.

The value only helps if it’s true today. A small shop that sells its last one at a market on Saturday and doesn’t update the website until Wednesday is telling Google, and the next shopper, something that isn’t so. When something sells out, mark it sold out on the page the same day, and keep the page up if it’s coming back, rather than deleting it and breaking every link to it.

## Reviews and ratings: only real ones

Star ratings in product results are tempting, which is exactly why Google’s rules around them are strict. The merchant listing guide lists aggregateRating and review as recommended properties, says they should follow Google’s review snippet guidelines, and says a reviewer’s name must be a valid name for a person or team ([merchant listing documentation](${MERCHANT_SD})).

The review snippet guidelines then set the rules ([Google review snippet guidelines](${REVIEW_SD})):

- Ratings must be sourced directly from users.
- The review content you mark up must be readily available to users on the marked-up page. If you mark up an average rating, people must be able to see it on the page.
- Reviews must be about a specific item, not a category or a list of items.
- Don’t aggregate reviews or ratings from other websites.
- Don’t include fake or undisclosed incentivized reviews. Reviews must reflect a genuine experience, and any incentive, like payment or free products, must be clearly disclosed.
- If you show several individual reviews, also include an aggregate rating of them.

Violations can lead to a manual action ([Google review snippet guidelines](${REVIEW_SD})). For a shop with a handful of genuine reviews, the honest route is to show them on the product page, word for word, with the reviewer’s permission, and mark up exactly those. If a product has no reviews yet, it simply has no rating markup. That’s fine. Our guide on [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) covers how to ask customers without breaking the rules.

## What else affects how your product appears

Structured data isn’t the only source Google uses. The product documentation says providing both structured data on web pages and a Merchant Center feed maximizes your eligibility for shopping experiences ([Google product structured data](${PRODUCT_SD})). And when information conflicts, the merchant listing guide puts product-level feeds submitted in Merchant Center above settings in Merchant Center or Search Console, which in turn sit above the markup on your pages ([merchant listing documentation](${MERCHANT_SD})).

The ordinary parts of the page still matter too. The title of a product page should say what the product is in the words a shopper would use, and the meta description should give a reason to click; our guide to [page titles and descriptions that get clicks](/blog/page-titles-and-descriptions-that-get-clicks) shows how. If you run a physical shop as well, your business details belong in your own markup; see [structured data for local businesses](/blog/structured-data-for-local-businesses).

## How to test your product pages

Google’s merchant listing guide gives the steps ([merchant listing documentation](${MERCHANT_SD})):

1. **Validate the code** with the Rich Results Test and fix any critical errors.
2. **Check how Google sees the page** with the URL Inspection tool in Search Console.
3. **Allow time.** Google advises allowing several days after publishing for pages to be crawled again.
4. **Watch the reports.** Search Console has a Merchant listings report for pages where shoppers can buy, and a Product snippets report for other product pages like reviews. After big site changes, watch for a rise in invalid items.

If a test shows an error, it usually names the missing or wrong property. The common ones for small shops are a missing image, a price of zero, a price without a currency, or markup describing a page that lists many products.

## A checklist for each product page

1. One page per product, with its own address, linked from its category page.
2. A buy button on the page, if you want it eligible for merchant listings.
3. Product markup with name, image and an Offer; a price greater than zero; a three-letter currency.
4. Availability that matches today’s stock, set to sold out the day it sells out.
5. Several of your own photos, at least 50,000 pixels each, crawlable, showing the actual product.
6. A description you wrote, with size, materials, care and anything that would surprise a buyer.
7. Brand (at most one) and barcode identifiers where your products have them.
8. Sizes and colors handled as variants, with each choice updating the photo, price and stock.
9. Reviews only if they are real, visible on the page, about this product and disclosed if incentivized.
10. Shipping and return policies written and published.
11. A page title and meta description in the words shoppers use.
12. The page passes the Rich Results Test and a mobile speed test.

## Where SaySites fits

SaySites is a website builder for small businesses, and the Store plan adds a Shop to your site. You add products with photos, prices and descriptions, customers pay through checkout with your own Stripe account, and SaySites takes 0% of your sales (Stripe charges its normal card fee). Products on your Shop page are described to search engines in structured data with their name, price, currency and whether they’re in stock or sold out, and every page must pass a 95+ speed check before it can go live. Everything else on the site you change by saying it in plain words to Sofie, like “put our holiday gift guide on the home page,” and you see each change as a draft first. Nothing is invented: products, photos and reviews come from you.

The Store plan is $25 a month or $250 a year, with hosting included and your own domain connected ([websites for independent shops](/websites-for/shops), [pricing](/pricing)). Want to see your current site rebuilt first? [Get a free redesign](/redesign). Or [start a 7-day free trial](/signup) and put your first products online this week.`,
    faq: [
      { q: 'What is the difference between product snippets and merchant listings?', a: 'Product snippets are for pages where people can’t buy the product directly, such as reviews and comparison articles. Merchant listings are for pages where a shopper can purchase from you, and they can show details like shipping and returns. Google notes that adding the properties required for merchant listings means a product page can also be eligible for product snippets.' },
      { q: 'What structured data does a product page need for Google?', a: 'For merchant listings, Google requires a product name, an image and an Offer. The Offer needs a price greater than zero and the currency in three-letter ISO 4217 form, such as USD. Recommended extras include availability, brand, barcode identifiers, item condition, the page address, and shipping and return policy details.' },
      { q: 'Can a product priced at zero appear in merchant listings?', a: 'No. Google’s merchant listing documentation says that, unlike product snippets, merchant listing experiences require a price greater than zero. A free sample or a “free with purchase” item can still have a page that helps shoppers, but it won’t be eligible for merchant listings. Make sure paid products never show a zero price by mistake.' },
      { q: 'How big should product photos be for Google?', a: 'Google recommends multiple high-resolution images of at least 50,000 pixels when you multiply width by height, in 16x9, 4x3 and 1x1 aspect ratios. Image addresses must be crawlable and indexable, and the photos must show the product being sold. Pictures that clearly show the product, for example on a white background, are preferred.' },
      { q: 'How should I handle sizes and colors on product pages?', a: 'Google describes product variants with a ProductGroup that lists what varies, such as size or color, and each variant as its own Product. With one page per product, each variant needs a distinct address using query parameters that preselects it, showing the right photo, price and availability. Alternatively, each variant gets its own fully marked-up page.' },
      { q: 'Can I add star ratings to my product pages?', a: 'Only for real reviews. Google’s guidelines say ratings must come directly from users, be visible on the page, be about that specific product, and not be copied from other websites. Fake reviews and undisclosed incentivized reviews are not allowed, and violations can lead to a manual action. A product without reviews should simply have no rating markup.' },
      { q: 'How much is a SaySites online store?', a: 'The Store plan is $25 a month or $250 a year, with hosting and a Shop page included and your own domain connected. Customers pay through your own Stripe account and SaySites takes 0% of sales; Stripe charges its normal card fee. There is a 7-day free trial, and you can ask for a free redesign preview of your current site first.' },
    ],
    about: ['Product structured data', 'Google merchant listings', 'Small online shops'],
    published: '2026-10-16',
    status: 'published',
  },
  {
    slug: 'free-product-listings-on-google',
    title: 'Free Product Listings on Google: A Small Shop’s Guide',
    description: 'How a small shop gets products into Google’s free listings: where they appear, the Merchant Center steps, required product details, shipping and returns.',
    kind: 'guide',
    summary: [
      'Free listings let your products appear at no cost across Google, including Search, the Shopping tab, Images, Lens, YouTube in some countries, Maps and the products on your Business Profile.',
      'Turning on free listings in Merchant Center gives Google permission to show your products; Google says it doesn’t guarantee they will be shown.',
      'Every product needs an id, title, link, image link, price, description and availability, and in the US and many other countries you must also set up shipping.',
      'Products crawled from your online store can appear even without Merchant Center, but a clean account with accurate data, returns and shipping gives Google the most to work with.',
      'If you also have a physical shop, free local listings can show your in-store products with hours, directions and distance.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1536936812504-0e77dc3f0b40?auto=format&fit=crop&w=1600&q=75', alt: 'Handmade ceramic cups with pink and cream glazes and a speckled tumbler displayed on a light wooden shop shelf' },
    body: `Google shows products from shops of every size, and for most of those places it charges nothing. Google calls them free listings: products that can appear at no cost across Google, with prices, photos and other details shoppers use to choose ([Google Merchant Center Help on free listings](${FREE_LISTINGS})). For a small shop that sells online, or a physical shop that wants nearby shoppers to know what’s on the shelves, they are one of the few places to be seen in Google without paying for ads.

This guide covers where free listings appear, how to turn them on, which product details Google requires, the shipping and return information you need, what happens if you don’t use Merchant Center at all, and the local version for shops with a counter and a front door. Everything here comes from Google’s own help pages, linked as we go, and those pages change, so check them before you start.

## What are free listings on Google?

Free listings are product listings that Google shows without charging the seller. Google’s help page says the products you sell can appear at no cost on Google Search and elsewhere, and describes them as a way to reach shoppers for online and local sales ([Google Merchant Center Help](${FREE_LISTINGS})). You give Google information about your products, usually through a free Google Merchant Center account, and Google uses it to match your products to what people search for.

They’re separate from Shopping ads, which you pay for. You can use free listings without ever running an ad.

## Where can free listings appear?

Google lists a wide set of places ([Google Merchant Center Help](${FREE_LISTINGS})):

- **Google Search:** in rich results, in Popular Products (for Apparel and Accessories, on mobile in the US only), and in the Shopping Knowledge Panel in listed countries.
- **The Shopping tab** at google.com/shopping.
- **Google Images,** including a “Product” label on images, and **Google Lens,** where people search with a photo.
- **YouTube,** in a limited set of countries.
- **Google Maps, Gemini,** and **the products module on your Business Profile.**

For a small shop, Lens and Images are worth a thought. Someone can point a phone at a mug a friend owns or a lamp in a café and search for it. If your product photos are clear and your data is accurate, your listing can be one of the answers.

## Does it cost anything?

No. Free listings are, as the name says, shown at no cost ([Google Merchant Center Help](${FREE_LISTINGS})). Merchant Center itself is free to use. Your costs are your own time and, if you want them, ads, which are optional and separate.

## Permission to show, not a promise

This is the part people misread. Merchant Center has a Free listings status, and Google’s help page says it controls permission to show your products for free; it doesn’t guarantee that your products will be shown to customers ([Google Merchant Center Help](${FREE_LISTINGS})). Google also says it relies on the data you provide to match your products to searches.

So a green status means you’re in the running. Whether a given product shows up for a given search depends on how well your product information matches what that person is looking for, along with everything else Google weighs. Anyone who promises you a spot in free listings is promising something Google itself doesn’t.

![Rows of unglazed white ceramic pieces, including teapots, cups, vases and small animal figures, crowded together on a workshop table](https://images.unsplash.com/photo-1612870199268-d33b7e0bd9b0?auto=format&fit=crop&w=1200&q=75)

## How to turn on free listings in Merchant Center

Google’s help page describes the setup ([Google Merchant Center Help](${FREE_LISTINGS})):

1. **Create a Merchant Center account,** if you don’t have one. Google says new accounts are opted in to free listings by default.
2. **For an existing account,** find the “Free listings” card under Marketing methods in the left navigation and check its status there.
3. **Make sure the right person has access.** Only users with Admin access can change the free listings setting.
4. **Add your products,** with the required details described below.
5. **Set up shipping and add your return policy,** which the page lists among the requirements.

If an outside company or platform created your Merchant Center account for you and sends your product data through the Merchant API, Google says changes go through that partner instead ([Google Merchant Center Help](${FREE_LISTINGS})).

Google also asks you to follow its policies for showing products for free across Google, which cover what can be listed and how ([Google Merchant Center Help](${FREE_LISTINGS})). Read them once before you upload; it’s quicker than fixing disapproved products later.

## The product details Google requires

Google lists the attributes required for all products ([Google Merchant Center Help](${FREE_LISTINGS})):

- **id:** your own unique code for the product, such as your SKU.
- **title:** the product’s name.
- **link:** the address of the product’s page on your website.
- **image link:** the address of the main product photo.
- **price:** the price.
- **description:** a description of the product.
- **availability:** whether it’s in stock.

Some attributes are required only in certain cases ([Google Merchant Center Help](${FREE_LISTINGS})):

- **condition,** if the product is used or refurbished.
- **brand, GTIN** (the barcode number), or **MPN** if there’s no GTIN, for products that have them.
- **multipack** and **bundle,** if you sell those.
- **item group ID,** for variants like sizes and colors.
- **color, size, age group and gender,** for Apparel and Accessories.

Google recommends extras too, including additional image links and a canonical link, and for apparel, pattern, material, size type and size system. For a place in the Shopping Knowledge Panel, it asks for strong identifiers: a GTIN, or an MPN plus brand ([Google Merchant Center Help](${FREE_LISTINGS})).

On images, Google says they should be large enough and free of promotional content ([Google Merchant Center Help](${FREE_LISTINGS})). That rules out “SALE” banners, price stickers and watermarks across the product photo.

A small shop selling handmade goods often has no GTIN, because no barcode was ever registered. The requirement applies to products that have one; leave it out if yours genuinely don’t, rather than inventing a number.

## Which pages count?

Free listings are for product pages. Google’s help page says they are not for pages like your home page, your shipping and return policy pages, or category pages ([Google Merchant Center Help](${FREE_LISTINGS})). The link you give for each product should go to a page about that one product, where a shopper can see the price and buy it.

That lines up with how Google reads product pages for its search results. We covered the details, including the structured data, photos and variants, in [product pages Google can show](/blog/product-structured-data-small-shops).

## Shipping and returns are part of the deal

Google’s help page says you’re required to set up shipping settings in Merchant Center, or add shipping costs to each product with the shipping attribute, in a long list of countries that includes the United States, Canada, the United Kingdom, Australia, India, Japan and most of the European Union ([Google Merchant Center Help](${FREE_LISTINGS})). If you sell to customers in the US, shipping information isn’t optional.

For returns, the page tells you to add your return policy information to your website so customers see returns information next to products, recommends adding the return policy in Merchant Center, and notes that return policies can affect purchase decisions ([Google Merchant Center Help](${FREE_LISTINGS})).

Both of these are worth writing down carefully before you enter them anywhere, because they’re also promises to your customers. Our guide to [shipping, local pickup and return policies](/blog/shipping-and-return-policy-small-online-shop) covers what to put in them, including the federal rule on shipping times.

## Can my products show up without Merchant Center?

Yes, sometimes. Google’s help page says products and their details crawled on your online store can show up on Google even without a Merchant Center account or schema.org markup, so shoppers can see products from many retailers ([Google Merchant Center Help](${FREE_LISTINGS})).

Two things follow from that:

- **Your product pages are already being read.** Clear names, real prices, honest stock status and good photos on the page matter even if you never open Merchant Center.
- **You can opt out.** Google says you can stop this with crawl and indexing controls, such as the [robots meta tag](${ROBOTS_META}). The page also notes that Google may still show information you added in Merchant Center, like titles and images, even if you turn off a free listing.

Merchant Center is still worth setting up for most shops that sell online, because it lets you give Google exact, structured product data and see what’s approved or disapproved. Google’s own product documentation says providing both structured data on web pages and a Merchant Center feed maximizes your eligibility ([Google product structured data](${PRODUCT_SD})).

![Small corner shop seen through a half-open metal shutter at night, its shelves stacked with bottles, jars and boxes around a counter](https://images.unsplash.com/photo-1780765896926-8cc2d92cb069?auto=format&fit=crop&w=1200&q=75)

## Free local listings for shops with a counter

If you have a physical store, there’s a local version. Google’s help page says your in-store products may appear in free local listings on the Shopping tab if you’ve opted in, and that a local listing could include store hours, directions, phone number, product price, availability and approximate distance ([Google Merchant Center Help](${FREE_LISTINGS})).

Google’s overview of local inventory and free local listings says that with free local listings, the in-store products you sell can appear at no cost across Google, and that if your website lacks inventory for your stores, you can show your in-store inventory using a Google-hosted page for your store ([local inventory ads and free local listings](${LOCAL_LISTINGS})). The same overview describes pickup options, such as “pickup today” for items bought online and collected the same or next day, as features of local inventory ads, which are paid ([local inventory ads and free local listings](${LOCAL_LISTINGS})).

For a shop that’s mostly about foot traffic, this is the practical point: people searching “near me” for a specific thing can learn that you have it in stock, a few streets away, before they set out. It depends on keeping your in-store inventory data current, which is real work for a busy shop. Start with the products people ask for by name.

## Get the basics right first

Free listings reward accurate, specific product data. Before you upload anything:

- **Write titles the way shoppers search.** “Hand-thrown stoneware mug, 12 oz, speckled white” tells Google and a shopper far more than “The Daisy.” Our guide to [page titles and descriptions that get clicks](/blog/page-titles-and-descriptions-that-get-clicks) applies here too.
- **Use your own photos.** The same product photo on many sites gives Google no reason to prefer yours, and photos of your actual stock are more honest.
- **Keep prices and stock in sync.** If the price in Merchant Center differs from the one on the page, or an item shows in stock that sold out last week, shoppers notice.
- **Describe, don’t pad.** A description should help a buyer decide: size, materials, care, what’s in the box. Google’s guidance on [helpful content](${HELPFUL}) applies to product pages as much as articles.
- **Make your shop easy to trust.** A clear About page, a contact page, a physical address if you have one, and your policies linked from every product page.

## A checklist for free listings

1. A Merchant Center account, with an Admin who can manage the free listings setting.
2. The Free listings card under Marketing methods showing your status.
3. Every product with id, title, link, image link, price, description and availability.
4. Brand, GTIN or MPN, condition, and apparel details where they apply; left out where they genuinely don’t.
5. Each link going to a single product page with a visible price and a way to buy.
6. Photos large enough, of the real product, with no promotional text or watermarks.
7. Shipping settings set up, required in the US and many other countries.
8. A return policy on your website and in Merchant Center.
9. Product pages that read well to Google even without Merchant Center, with markup that matches the page.
10. For a physical store, free local listings with current in-store inventory, if you can keep it up to date.

## Where SaySites fits

SaySites is a website builder for small businesses, and its Store plan gives you a Shop on your own website. You add products with photos, prices and descriptions; customers pay through checkout with your own Stripe account; and SaySites takes 0% of your sales (Stripe charges its normal card fee). Products on your Shop page are described to search engines with their name, price, currency and whether they’re in stock or sold out, and every page must pass a 95+ speed check before it goes live. The rest of the site, like your hours, your About page or a holiday notice, you change by telling Sofie in plain words, and you see each change as a draft before it’s published. Merchant Center itself is Google’s, and you set it up in your own Google account.

The Store plan is $25 a month or $250 a year, with hosting included and your own domain connected ([websites for independent shops](/websites-for/shops), [pricing](/pricing)). Curious what your current site would look like rebuilt? [Get a free redesign](/redesign). Or [start a 7-day free trial](/signup) and get your products online.`,
    faq: [
      { q: 'Are Google free listings really free?', a: 'Yes. Google’s Merchant Center Help says the products you sell can appear at no cost on Google Search and across other Google surfaces, and Merchant Center is free to use. Shopping ads are a separate, paid option that you can choose to run or ignore. Your only cost for free listings is the time to set up and maintain accurate product data.' },
      { q: 'Where do free product listings appear?', a: 'Google lists Search, including rich results, Popular Products and the Shopping Knowledge Panel in certain countries, plus the Shopping tab, Google Images, Google Lens, YouTube in limited countries, Google Maps, Gemini and the products module on your Business Profile. Popular Products for apparel is limited to mobile in the US. Where a product appears depends on what people search for.' },
      { q: 'Does turning on free listings guarantee my products will show?', a: 'No. Google says the Free listings status in Merchant Center controls permission to show your products for free and doesn’t guarantee they will be shown to customers. Google matches products to searches using the data you provide, so accurate titles, prices, photos, descriptions and availability give it the most to work with. No one can promise a placement.' },
      { q: 'What product information does Google require for free listings?', a: 'Every product needs an id, title, link, image link, price, description and availability. Some products also need condition, brand, GTIN or MPN, multipack, bundle or an item group ID for variants. Apparel and Accessories need color, size, age group and gender. Google recommends extras like additional images, and says images should be large and free of promotional content.' },
      { q: 'Do I need shipping settings for free listings?', a: 'In many countries, yes. Google says you’re required to set up shipping settings in Merchant Center, or add shipping costs with the shipping attribute, in countries including the United States, Canada, the United Kingdom, Australia and much of Europe. Google also tells you to add your return policy to your website and recommends adding it in Merchant Center.' },
      { q: 'Can my products appear on Google without Merchant Center?', a: 'They can. Google says products and details crawled from your online store can show up even without a Merchant Center account or schema.org markup. You can stop that with crawl and indexing controls such as the robots meta tag. Merchant Center is still useful, because it gives Google exact product data and shows you what was approved or disapproved.' },
      { q: 'How much does a SaySites store cost?', a: 'The Store plan is $25 a month or $250 a year, with hosting and a Shop page included and your own domain connected. Customers pay through your own Stripe account, SaySites takes 0% of sales, and Stripe charges its normal card fee. There is a 7-day free trial, and a free redesign preview if you want to see your current site rebuilt first.' },
    ],
    about: ['Google free listings', 'Google Merchant Center', 'Small online shops'],
    published: '2026-10-17',
    status: 'published',
  },
  {
    slug: 'shipping-and-return-policy-small-online-shop',
    title: 'Shipping and Return Policies for a Small Online Shop',
    description: 'What a small online shop’s shipping, pickup and return policies should say, the FTC rule on shipping times and refunds, and the markup Google reads.',
    kind: 'guide',
    summary: [
      'Under the FTC’s Mail, Internet, or Telephone Order Merchandise Rule, you need a reasonable basis for any shipping time you state, and if you state none you must ship within 30 days.',
      'If you can’t ship on time, you must tell the customer and offer the choice to wait or cancel; refunds for cash, check or third-party credit card orders are due within seven working days.',
      'Google can show your return and shipping policies next to products: return policy markup goes under Organization, or you can link to your policy page with merchantReturnLink.',
      'Settings you enter in Merchant Center or Search Console take precedence over markup on your pages, so keep them and your written policy identical.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1624137527136-66e631bdaa0e?auto=format&fit=crop&w=1600&q=75', alt: 'Plain brown cardboard boxes, some with open flaps, stacked unevenly against a warm brown wall' },
    body: `A small online shop makes two promises with every order: when it will arrive, and what happens if the customer doesn’t want it. Those promises live in your shipping and return policies, and in the United States, the shipping one is backed by a federal rule. Google also reads these policies and can show them next to your products in Search, which means a clear, accurate policy helps a shopper before they ever reach your site.

This guide covers what the FTC’s rule requires on shipping times, delays and refunds, what to put in a shipping policy, how to describe local pickup honestly, what a return policy should say, and how to give Google the same information through structured data or its own settings. It is general information, not legal advice. The rule text and the FTC’s guide to it are linked throughout.

## The FTC rule every US online shop should know

The Federal Trade Commission enforces the Mail, Internet, or Telephone Order Merchandise Rule. Its business guide says the rule covers merchandise ordered by mail, via the internet or by telephone ([FTC business guide to the rule](${FTC_MAIL})). If you sell physical goods through a website, it applies to you.

The guide also lists what’s outside it. It says the rule does not cover services, such as mail order photo-finishing, and it lists exempt sales including magazine subscriptions after the first shipment, sales of seeds and growing plants, collect-on-delivery orders, and transactions covered by the FTC’s Negative Option Rule ([FTC business guide](${FTC_MAIL})).

The stakes are real. The FTC’s guide says merchants who break the rule can face civil penalties of up to $53,088 per violation, a figure updated in January 2025 for inflation, along with refunds to consumers ([FTC business guide](${FTC_MAIL})).

## Rule one: have a reasonable basis for any shipping time

The core of the rule is that you must have a reasonable basis to expect you can ship within the time you state ([FTC business guide](${FTC_MAIL})). The FTC defines that as having information that would satisfy a reasonable and prudent businessperson, acting in good faith.

For a small shop, that means your stated time should come from your actual experience, not your best week. If you make candles to order and it usually takes you four days to pour, cure and pack them, “ships in 1 to 2 days” isn’t a reasonable basis. The FTC also notes that an accurate, up-to-date recordkeeping system can help show you are complying ([FTC business guide](${FTC_MAIL})). Your order history, with order and ship dates, is that record.

The guide’s examples are pointed. If you say you ship in 48 hours “most of the time,” you are required to ship, or send a delay notice, within 48 hours all the time. And if you say in-stock items ship immediately, then unless you tell customers at ordering that an item isn’t in stock, you must ship, notify of a delay or cancel immediately ([FTC business guide](${FTC_MAIL})). Words like “usually” don’t soften the promise.

## Rule two: no time stated means 30 days

If your site doesn’t say when an order ships, the rule fills the gap: you must ship within 30 days after receiving a properly completed order. If the customer applies for credit to pay, the window is 50 days instead ([FTC business guide](${FTC_MAIL})).

Under the rule, an order counts as shipped when the merchandise is physically placed in the possession of the carrier ([FTC business guide](${FTC_MAIL})). Printing a label isn’t shipping; handing the box over is.

Thirty days is a backstop, not a goal. Most shoppers want a clearer answer, and a stated time you can keep is better for everyone than silence.

![Empty open cardboard box with its flaps folded out, photographed head-on against a white background](https://images.unsplash.com/photo-1573376670329-0261ea9fde97?auto=format&fit=crop&w=1200&q=75)

## When you can’t ship on time

Delays happen: a supplier runs late, a product sells faster than you can make it, you get sick. The rule tells you what to do ([FTC business guide](${FTC_MAIL})):

1. **Tell the customer before the promised time,** without waiting for them to ask, and offer the choice to accept the delay or cancel the order.
2. **Include in the first delay notice** a definite revised shipping date, or a statement that you can’t give one; a statement that if the customer doesn’t want to wait, they can cancel and get a full and prompt refund; and a way for the customer to cancel at your expense.
3. **If the new date is 30 days or less** after the original, a customer who doesn’t respond is treated as agreeing to the delay, but only if your notice said so.
4. **If the customer agrees to an indefinite delay,** they keep a continuing right to cancel at any time until you ship.
5. **For any further delay,** silence is not consent. Unless the customer agrees to the further delay, the order is automatically cancelled and you must give a prompt refund.

You can always skip the delay notice and simply cancel and refund. The FTC says you must then notify the customer and send the refund within the time a delay notice would have been due ([FTC business guide](${FTC_MAIL})).

The guide adds a note on order-status pages: posting a delay notice there can be an excellent way to back up notification by another means, but it isn’t enough alone if customers might not see it before the promised ship time ([FTC business guide](${FTC_MAIL})). Email the customer too.

## How fast refunds are due

When an order is cancelled under the rule, the refund deadlines are specific ([FTC business guide](${FTC_MAIL})):

- **Paid by cash, check, money order, or credit where a third party is the creditor** (which includes ordinary credit cards): refund within seven working days after the order is cancelled.
- **Paid on credit where you are the creditor** (a store account you run): credit the account, or notify the customer that the account won’t be charged, within one billing cycle.

Seven working days is a short window for a one-person shop that checks email twice a week. Decide now who issues refunds and how, so a cancellation doesn’t sit in an inbox.

## What to put in your shipping policy

A shipping policy is one page, linked from every product page and the checkout, that answers a shopper’s questions before they ask. A practical outline:

- **Processing time:** how long from order to handing the parcel to the carrier, based on your real records. If made-to-order items take longer than ready-made ones, say so separately.
- **Carriers and methods:** which services you use and roughly how long each takes once shipped, phrased as an estimate from the carrier rather than your promise.
- **Where you ship:** the states or countries you deliver to, and any you don’t.
- **Costs:** flat rates, rates by weight or order value, or free shipping over an amount, exactly as they’ll appear at checkout.
- **Delays:** what you’ll do if something can’t ship on time, in line with the rule above: you’ll tell them and offer to cancel.
- **Damaged or lost parcels:** who to contact and what you need, such as a photo of the damage.
- **Contact:** an email address that someone reads.

Keep the numbers on this page and at checkout identical. If the policy says orders ship in three business days and a product page says “ships tomorrow,” the stricter promise is the one the customer will hold you to.

## Local pickup: say exactly how it works

Many small shops let local customers skip shipping and collect their order. If you offer it, the policy should cover:

- **Where:** the address, and which door or counter if it isn’t obvious.
- **When:** the hours pickup is available, and how much notice you need.
- **How they’ll know it’s ready:** an email or text when the order is packed, and how long you’ll hold it.
- **What to bring:** an order number or name, and whether someone else can collect.

Only offer pickup windows you can staff. A customer who drives across town to a locked door is worse off than one who paid for postage.

## What to put in your return policy

No law requires a shop to accept returns of items that aren’t faulty, but whatever you decide, write it down plainly. Shoppers read return policies before they buy, and Google can show the key facts next to your products. Cover:

- **Whether you accept returns,** and for which items. Many shops exclude personalized, made-to-order or final-sale items; say so on those product pages too.
- **The window:** how many days, and from when. Google’s markup counts from the delivery date ([Google return policy structured data](${RETURN_SD})), which is a clear choice for customers as well.
- **Condition:** unused, with tags, in original packaging, or whatever you need.
- **How to return:** by mail, in store, or both, and whether the customer needs to contact you first.
- **Who pays for return shipping,** and whether you charge a restocking fee.
- **What they get back:** a refund to the original payment method, store credit or an exchange, and how quickly you process it.
- **Faulty or damaged items:** usually treated differently, with the shop covering return costs.

Then make sure the policy matches what you actually do. If you’ve quietly been accepting returns after 45 days but the page says 30, update one of them.

![Two plain cardboard boxes on dark wooden shelves beside a small stack of books, with potted plants in metal buckets on the top shelf](https://images.unsplash.com/photo-1577702312572-5bb9328a9f15?auto=format&fit=crop&w=1200&q=75)

## Show your return policy to Google

Google’s return policy documentation says that when you add this markup, Google Search can use it to display return policies alongside your products and in knowledge panels ([Google return policy structured data](${RETURN_SD})).

There are two ways to provide it:

- **Shop-wide:** a MerchantReturnPolicy nested under your Organization markup with the hasMerchantReturnPolicy property. This is the usual choice for a small shop with one policy.
- **Per product:** one or more MerchantReturnPolicy entries under a product’s Offer, which can override the shop-wide policy for that item.

For the required properties, Google lets you choose ([Google return policy structured data](${RETURN_SD})):

- **The full option:** applicableCountry (the country the policy applies to), returnPolicyCategory, and, for a set window, merchantReturnDays (the number of days from delivery). The category is one of MerchantReturnFiniteReturnWindow (a set number of days), MerchantReturnNotPermitted (no returns) or MerchantReturnUnlimitedWindow (no time limit).
- **The minimal option:** merchantReturnLink, the address of the page that describes your return policy.

Google also recommends details that answer the questions above: returnMethod (ReturnByMail, ReturnInStore or ReturnAtKiosk), returnFees (FreeReturn, ReturnFeesCustomerResponsibility or ReturnShippingFees, with returnShippingFeesAmount), refundType, itemCondition, restockingFee, separate fees for customer-remorse and defect returns, and returnLabelSource ([Google return policy structured data](${RETURN_SD})).

## Show your shipping policy to Google

Google’s shipping policy documentation works the same way. With ShippingService markup, Google Search can display shipping information alongside your products ([Google shipping policy structured data](${SHIPPING_SD})).

- **Shop-wide:** a ShippingService nested under Organization with the hasShippingService property. Google recommends placing it on one page that describes your shipping policy.
- **Per product:** OfferShippingDetails under an Offer with the shippingDetails property, which supports fewer properties.

The only required property on ShippingService is shippingConditions, and a destination region needs its country ([Google shipping policy structured data](${SHIPPING_SD})). Recommended properties include shippingRate, shippingDestination, handlingTime, transitTime, orderValue, weight and fulfillmentType. Free shipping over a threshold is modeled as a rate of zero for an order value range, and if several conditions apply, Google uses the lowest shipping cost for the situation. For fulfillmentType, the documentation lists delivery, which is the default, and FulfillmentTypeCollectionPoint, where the product is shipped to a collection point for customer pickup ([Google shipping policy structured data](${SHIPPING_SD})).

## Which source wins: your markup or Google’s settings?

Both the return and shipping documentation set an order of precedence, from strongest to weakest: account settings sent through Google’s API, then settings in Merchant Center or Search Console, then product-level markup, then Organization-level markup. If you provide both markup and Search Console settings, Google says it will only use the information in Search Console ([Google return policy structured data](${RETURN_SD}), [Google shipping policy structured data](${SHIPPING_SD})).

The merchant listing documentation adds that Merchant Center settings can be easier than markup when your policies change often ([merchant listing documentation](${MERCHANT_SD})). Whichever you use, the rule is the same: your written policy page, the details at checkout, your markup and any Google settings should all say the same thing. Free listings in Merchant Center also require shipping information in the US and many other countries; see [free product listings on Google](/blog/free-product-listings-on-google). For the product side of the markup, see [product pages Google can show](/blog/product-structured-data-small-shops).

## A checklist for your policies

1. A shipping time based on your real order records, stated the same everywhere it appears.
2. A plan for delays: a notice that offers to wait or cancel, sent before the promised date.
3. Refunds for cancelled orders within seven working days, with someone responsible for issuing them.
4. A shipping policy page: processing time, carriers, destinations, costs, delays, damage, contact.
5. Local pickup details, if you offer it: where, when, how they’ll know, what to bring.
6. A return policy page: window from delivery, condition, method, who pays, refund type and timing.
7. Final-sale and personalized items marked on their product pages.
8. Policy pages linked from every product page and the checkout.
9. Return and shipping policies described to Google, by markup or in Merchant Center or Search Console, matching the pages.
10. A yearly check that the policy still matches what you actually do.

## Where SaySites fits

SaySites is a website builder for small businesses. On the Store plan, your site gets a Shop where you add products with photos, prices and descriptions, and customers pay through checkout with your own Stripe account; SaySites takes 0% of your sales, and Stripe charges its normal card fee. Writing and updating your shipping and return policy pages is something you can do by telling Sofie in plain words, like “add a returns page: 30 days from delivery, unused, customer pays return postage,” and you see the page as a draft before it goes live. Every page must pass a 95+ speed check, and products are described to search engines with their name, price, currency and stock status. The policies themselves are yours to decide; SaySites publishes what you say, nothing invented.

The Store plan is $25 a month or $250 a year, with hosting included and your own domain connected ([websites for independent shops](/websites-for/shops), [pricing](/pricing)). Want to see your current shop’s site rebuilt? [Get a free redesign](/redesign). Or [start a 7-day free trial](/signup) and publish your policies alongside your first products. For more on what belongs on the front page of a small business site, read [what to put on your home page](/blog/what-to-put-on-your-home-page).`,
    faq: [
      { q: 'How long do I have to ship an online order?', a: 'Under the FTC’s Mail, Internet, or Telephone Order Merchandise Rule, you must ship within the time you state, and you need a reasonable basis to expect you can. If you state no time, you must ship within 30 days of receiving a properly completed order, or 50 days if the customer applies for credit to pay. Shipped means handed to the carrier.' },
      { q: 'What do I do if an order is going to ship late?', a: 'Tell the customer before the promised date and offer the choice to wait or cancel. The first notice needs a revised date or a statement that you can’t give one, a statement that they can cancel for a full and prompt refund, and a way to cancel at your expense. You can also simply cancel and refund instead.' },
      { q: 'How quickly must I refund a cancelled online order?', a: 'The FTC’s guide says that if the customer paid by cash, check, money order or credit from a third party, such as an ordinary credit card, you must refund within seven working days after the order is cancelled. If you are the creditor, through a store account, you must credit the account within one billing cycle.' },
      { q: 'Does a small online shop have to accept returns?', a: 'The FTC rule covered here is about shipping times and refunds for orders you can’t ship, not about returns of items customers simply don’t want. Whatever return policy you choose, write it down clearly: the window, the item condition, how to return, who pays postage and what refund the customer gets. Check your own state’s laws too.' },
      { q: 'How do I show my return policy in Google search results?', a: 'Google can show return policies next to products when you add MerchantReturnPolicy markup, usually nested under your Organization markup. You can give the country, the policy category and the number of days, or simply link to your policy page with merchantReturnLink. Settings entered in Merchant Center or Search Console take precedence over markup on your pages.' },
      { q: 'Can my shipping markup describe local pickup?', a: 'Google’s shipping policy documentation lists a fulfillmentType property with delivery as the default and FulfillmentTypeCollectionPoint, where the product is shipped to a collection point for customer pickup. Whatever you mark up, explain local pickup on your shipping policy page too: the address, the hours, how customers will know the order is ready, and what to bring.' },
      { q: 'How much does it cost to sell online with SaySites?', a: 'The Store plan is $25 a month or $250 a year, with hosting and a Shop page included and your own domain connected. Customers pay through your own Stripe account and SaySites takes 0% of sales, while Stripe charges its normal card fee. You can try it free for 7 days, or ask for a free redesign preview of your current site.' },
    ],
    about: ['Shipping policy', 'Return policy', 'FTC Mail, Internet, or Telephone Order Merchandise Rule'],
    published: '2026-10-18',
    status: 'published',
  },
  {
    slug: 'houston-law-firm-website-design',
    title: 'Houston Law Firm Website Design: Texas Bar Rules',
    description: 'What a Houston law firm website must show under Texas advertising rules, when the home page must be filed, and how to build for Harris County clients.',
    kind: 'guide',
    summary: [
      'Texas Rule 7.02 requires every ad, including your website, to name a lawyer responsible for its content and identify that lawyer’s primary practice location.',
      'Most of a Texas firm website is exempt from filing with the State Bar’s Advertising Review Committee, but the home page may need to be filed within 10 days unless its content is exempt.',
      '“Board Certified” has exact required wording under Rule 7.02(b), and contingent fee claims must say whether clients pay case expenses.',
      'A website is not a solicitation in Texas, but the barratry laws still shape what follow-up you send after an accident.',
      'Harris County has 72 district courts and nearly half its residents speak a language other than English at home, so specific practice pages and real Spanish pages matter.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1609445333560-e03ba271b2ce?auto=format&fit=crop&w=1600&q=75', alt: 'Downtown Houston’s glass towers rising beyond a grassy park with oak trees and people relaxing on the lawn' },
    body: `A Houston law firm website has to satisfy the Texas Disciplinary Rules of Professional Conduct before it can do anything else. In short: name a lawyer who is responsible for the site and give that lawyer’s primary practice location, never create unjustified expectations about results, use “Board Certified” only in the exact form Rule 7.02(b) allows, say whether clients pay expenses wherever you mention contingent fees, and check whether your home page has to be filed with the State Bar’s Advertising Review Committee. Then build the site for how Harris County clients actually look for a lawyer: by problem, by courthouse, on a phone, and often in Spanish.

Below, each rule is quoted from the State Bar of Texas’s own text with the link, followed by the Houston court landscape, the barratry rules that limit follow-up, Google Business Profile setup, and a checklist. This is general information, not legal or ethics advice. For a ruling on a specific ad, Texas lets you ask the Advertising Review Committee in advance, which is covered below.

## What does Texas require on a law firm website?

Texas rewrote its advertising rules effective July 1, 2021, and the State Bar publishes the current Part VII text on its Advertising Review page ([State Bar of Texas, Advertising Review](${TX_ADREVIEW})). The core requirement for any advertisement is short. Rule 7.02(a) says: “An advertisement of legal services shall publish the name of a lawyer who is responsible for the content of the advertisement and identify the lawyer’s primary practice location” ([Texas Rules, Part VII](${TX_RULES})).

On a website, that usually means a footer line on every page with the responsible attorney’s name and the office city or address where that attorney mainly practices. Putting it only on the Contact page is risky, because a visitor who lands on a practice area page from Google may never see the Contact page, and each landing page is doing the advertising.

Two more required statements come up on most firm sites:

- **Contingent fees.** Rule 7.02(c) says that if an ad “discloses a willingness to render services on a contingent fee basis, the advertisement must state whether the client will be obligated to pay for other expenses, such as the costs of litigation” ([Rule 7.02](${TX_RULES})). If your home page says “No fee unless we recover,” the expenses sentence belongs right next to it.
- **Advertised fees.** Under Rule 7.02(d), a lawyer who advertises a fee must honor it for the ad’s expected circulation period, though not for more than one year after publication unless the lawyer expressly promised longer. A flat fee on a web page should be one you are ready to keep.

The comments add a practical point for screens. Comment 6 to Rule 7.01 says that in internet ads, written statements “must appear in a size and font, and for a sufficient length of time, that a viewer can easily see and read the statements.” Light grey eight-point disclaimers fail that test on a phone.

## Does a Houston firm have to file its website with the State Bar?

Usually only the home page, and sometimes not even that. Rule 7.04(a) requires a lawyer to file a non-exempt advertisement with the Advertising Review Committee no later than ten days after it is first disseminated, with a copy, an application and a fee. Rule 7.05(b) then exempts “information and links posted on a law firm website, except the contents of the website homepage, unless that information is otherwise exempt from filing” ([Rules 7.04 and 7.05](${TX_RULES})).

Comment 2 to Rule 7.05 spells it out: the entire website must comply with Rules 7.01 and 7.02, but “the only material on the website that may need to be filed pursuant to this Rule is the contents of the homepage. However, even a homepage does not need to be filed if the contents of the homepage are exempt.”

What makes a home page exempt? Rule 7.05(i) exempts communications that contain only basic information: the lawyer’s or firm’s name, addresses and phone numbers, areas of practice, bar admissions, education, foreign language abilities, Texas Board of Legal Specialization certification, fees for an initial consultation, required disclosures, and similar items. Once the home page adds slogans, case results, client quotes or claims about the firm’s skill, it is likely outside that list and needs filing.

The cost of skipping it is real. The State Bar’s page says the application fee is $100, and that if a non-exempt ad that was never filed comes to its attention, “the State Bar may assess a $250 fine and a $100 review fee,” adding that failure to file is itself a violation of the disciplinary rules ([Advertising Review](${TX_ADREVIEW})). Filing is done through the Advertising Review Portal on your My Bar Page.

Two habits make this painless:

1. **Treat a home page redesign as a new ad.** The State Bar notes that ads approved under the old rules need no refiling only if unchanged; a substantive change needs a new application and fee. A new home page with new claims is a substantive change.
2. **Use pre-approval for anything bold.** Rule 7.04(c) lets you submit an ad at least thirty days before it runs, and a finding of compliance “is binding in favor of the submitting lawyer.” For a new firm site with results on the home page, that month of lead time is worth building into the launch plan.

Not sure how your current home page would read to the committee? Send us your address for a [free redesign](/redesign). You’ll see your own pages rebuilt with the responsible lawyer line, expense disclosures and readable disclaimers in place, with no cost and no commitment.

![Three professionals in suits at a white table, one signing a document while the others look on](https://images.unsplash.com/photo-1758518731462-d091b0b4ed0d?auto=format&fit=crop&w=1200&q=75)

## What can’t a Texas law firm say on its website?

Rule 7.01(a) bars any “false or misleading communication about the qualifications or services of a lawyer or law firm.” It defines misleading in two ways: a statement likely to lead a reasonable person to a conclusion “for which there is no reasonable factual foundation,” or one “substantially likely to create unjustified expectations about the results the lawyer can achieve” ([Rule 7.01](${TX_RULES})). Most website problems fall under the second half.

### Results, verdicts and who gets credit

Texas is more specific than most states about case results:

- **Reduced verdicts.** Rule 7.01(g) says that if a lawyer knows an advertised verdict was later reduced or reversed, or the case settled for less, each ad of that verdict must state, with equal or greater prominence, the amount the client actually received.
- **Credit for results.** The Supreme Court of Texas amended Comment 10 in 2022 ([Misc. Docket No. 22-9011](${TX_ORDER})). It now says a lawyer may claim credit for a prior judgment or settlement only if the lawyer played a substantial role in obtaining it, a standard met if the lawyer “served as lead counsel or was primarily responsible for the settlement.” A lateral hire’s results from a former firm need that test before they appear on your site.
- **Context.** Comment 5 says truthful past results can still mislead if presented so a reasonable person expects the same outcome, and that “an appropriate disclaimer or qualifying language may preclude a finding that a statement is likely to mislead.”

For a results page, list the case type, the result, whether it was a verdict or settlement, the attorney who handled it, and a visible note that each case differs. Put the note beside the numbers, not in the footer.

### Comparisons, actors and trade names

Comment 7 warns that an unsubstantiated comparison with other firms “may be misleading if presented with such specificity as to lead a reasonable person to conclude that the comparison or claim can be substantiated.” “Houston’s most aggressive injury firm” and “we recover more than other firms” are the kinds of lines to drop unless you could prove them.

Comment 3 says using an actor to portray a lawyer is misleading if a reasonable person would conclude the actor is the lawyer. If a website video uses actors, label it.

Texas allows trade names. Rule 7.01(c) says lawyers “may practice law under a trade name that is not false or misleading,” and Comment 9 allows a distinctive website address or social media username that is not misleading. The State Bar’s FAQ adds that the disciplinary rules do not require a registered trade name, and that registering one with the Secretary of State does not by itself mean it complies ([Advertising Review FAQ](${TX_FAQ})). A domain that suggests a government agency or a public service, rather than a private firm, deserves a hard look before you buy it.

### Board Certified and specialist claims

Rule 7.02(b) generally bars statements of certification or special competence, with two exceptions. A lawyer certified by the Texas Board of Legal Specialization may state, for each area, “Board Certified, area of specialization -- Texas Board of Legal Specialization.” Other certifications are allowed only from organizations TBLS has accredited, and Comment 5 says the certifying organization’s name must appear in any communication about the certification ([Rule 7.02](${TX_RULES})).

Lawyers who aren’t board certified can still describe their work. Comment 3 permits saying a lawyer “practices, focuses, or concentrates” in an area, but the statement “must be objectively based on the lawyer’s experience, specialized training, or education.” On an attorney profile, “Board Certified, Personal Injury Trial Law -- Texas Board of Legal Specialization” and “practice focused on workers’ compensation claims” are both fine when true. “Specialist in truck accidents” is not.

## Is a law firm website a solicitation under Texas barratry rules?

No, and that matters. Comment 2 to Rule 7.03 says a communication “is not a solicitation if it is directed to the general public, such as through a billboard, an Internet banner advertisement, a website or a television commercial, or if it is made in response to a request for information, including an electronic search for information” ([Rule 7.03](${TX_RULES})). Someone who searches “Houston truck accident lawyer” and finds your page has asked for information.

What happens after the visitor reaches you is a different story. Rule 7.03(b) bars solicitation through in-person contact or “regulated telephone, social media, or other electronic contact,” meaning live or interactive contact, with narrow exceptions. Texas criminal law goes further. Penal Code section 38.12 makes it an offense to send a written communication about a personal injury or wrongful death claim, or one otherwise related to an accident or disaster, “before the 31st day after the date on which the accident or disaster occurred” ([Penal Code § 38.12](${PC_3812})). Violations of subsection (d) are a Class A misdemeanor, and some barratry offenses are third-degree felonies.

The civil side is just as serious. Under Government Code section 82.0651, a client can void a contract obtained through barratry and recover fees paid, damages and a $10,000 penalty, and a person who was solicited but never signed can recover a $50,000 penalty ([Gov’t Code § 82.0651](${GV_820651})). Both statutes were amended effective September 1, 2025, so older summaries may be out of date.

For a website, three practical rules follow:

1. Let visitors come to you. A contact form, a click-to-call button and a chat window that answers the visitor’s own questions are responses to a request for information.
2. Don’t buy lists. Never feed accident report data or scraped contacts into email or text campaigns from the site.
3. Vet lead sources. Comment 13 says a lawyer “must not pay a lead generator that states, implies, or creates a reasonable impression that it is recommending the lawyer.” Paying a website designer or a domain registrar is expressly fine under Comment 11.

When a solicitation is allowed, Rule 7.03(d)(2) requires it to be marked as an advertisement, and Comment 10 says the first word of an email’s subject line, or of a text or social media message, must be “ADVERTISEMENT.”

![Person typing on a laptop at a dark wooden desk beside an open book and a phone](https://images.unsplash.com/photo-1584556326561-c8746083993b?auto=format&fit=crop&w=1200&q=75)

## How do Harris County clients look for a lawyer?

They search for a problem in a place, and the place has a lot of courts. According to the Harris County District Courts, 72 of the more than 500 district courts in Texas are in Harris County: 29 civil, 29 criminal, 11 family and 3 juvenile district courts, plus 14 associate judges ([Harris County District Courts](${JUSTEX})). The county is still adding capacity: the 513th, 514th and 515th civil district courts opened on September 1, 2026, with the 516th and 517th scheduled to open on October 1 ([Harris County District Courts news release](${JUSTEX_NEW})). Federal cases go to the Southern District of Texas, whose Houston Division sits at the Bob Casey United States Courthouse, 515 Rusk Avenue, and covers Colorado, Fort Bend, Harris, Montgomery, San Jacinto and Wharton counties ([Southern District of Texas, Houston Division](${TXS_HOU})).

The lawyer market is crowded too. The State Bar’s 2025-26 profile counts 25,911 active attorneys in Harris County, up from 23,379 in 2015 ([Harris County attorney profile](${TX_HARRIS_ATTY})). A home page that says “we handle all legal matters” competes with every one of them at once.

That is why specific, first-hand pages work. Ideas that fit Houston practices:

- **Family law:** what happens at a first temporary orders hearing in the family district courts, what to bring, and how long the wait tends to be in your experience.
- **Criminal defense:** where an arrest in Houston leads next, how bail hearings work, and what a client’s family can do that first night.
- **Personal injury:** what to do in the first weeks after a crash on I-45 or the Beltway, how expenses work in your fee agreement, and why the firm cannot send letters during those first 30 days.
- **Employment and business law:** which agencies and deadlines apply, linked to the official sources.

Write these from your own cases and courtrooms. Google’s guidance on [helpful, people-first content](${HELPFUL}) asks for exactly this kind of experience, and an AI answer is far more likely to quote a page that explains one courthouse step clearly than a page that lists twenty practice areas.

## Should a Houston firm’s website be in Spanish?

For many firms, yes, if someone at the firm can serve those clients. Census Bureau figures show that 47.1% of Houston residents and 45.0% of Harris County residents age 5 and older speak a language other than English at home (2020 to 2024), and 44.2% of city residents and 46.1% of county residents are Hispanic or Latino ([Census QuickFacts](${CENSUS_HOU})).

Texas has one rule that every bilingual site must follow. Rule 7.01(d) says a statement or disclaimer required by the rules must be clear enough for an ordinary person to understand and “made in each language used in the communication” ([Rule 7.01](${TX_RULES})). So the Spanish version of a practice page needs the responsible lawyer line, the contingent fee expenses statement and any results qualifier in Spanish too. The same rule adds that simply stating a language is spoken (“Hablamos español”) doesn’t require the disclaimers in that language.

Good practice for the pages themselves:

- Have a fluent speaker who knows legal vocabulary write or review them; machine translation can change what a disclaimer means.
- Say who speaks Spanish: an attorney, a paralegal or the intake team. Clients care whether they can talk to the lawyer directly.
- Link each Spanish page to its English counterpart so Google can show the right version to each searcher ([localized versions](${HREFLANG})).
- Apply the same standards to Vietnamese, Chinese, Arabic or any other language your team speaks.

## Google Business Profile for Houston lawyers

Google treats lawyers as individual practitioners. Its guidelines name lawyers among them, allow a title like JD or Esq. in a practitioner’s profile, and say a practitioner should have their own profile only if they work in a public-facing role and can be contacted at the verified location during stated hours. When several practitioners share a location, the firm gets its own profile for that location, and each practitioner’s profile should carry only the practitioner’s name. A practitioner “shouldn’t have multiple Business Profiles to cover all of their specializations” ([Business Profile guidelines](${GBP_GUIDELINES})).

For a Houston firm with offices downtown and in, say, the Energy Corridor, that means one firm profile per staffed office, attorney profiles only for lawyers who meet the test, and the same name, address and phone on each office page of the website as on its profile. Our guide to [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) explains why relevance, distance and prominence all count. Avoid spinning up near-identical pages for Katy, Sugar Land, Pasadena and The Woodlands; Google’s spam policies treat that pattern as doorway abuse ([spam policies](${SPAM})). Build an office page where you have an office and a local page only where you have something real to say.

## A pre-launch checklist for a Houston law firm website

1. Responsible lawyer’s name and primary practice location on every page.
2. Expenses statement next to every contingent fee mention, in every language used.
3. Results show the type of case, who handled it and what the client received, with a visible qualifier; reduced verdicts show the final amount.
4. No unprovable comparisons, guarantees or “best” claims; actors labeled.
5. “Board Certified” only in the Rule 7.02(b) wording with TBLS named; “focuses on” only when objectively true.
6. Home page reviewed for exemption under Rule 7.05(i); if not exempt, filed within 10 days of launch, or submitted 30 days ahead for pre-approval.
7. Disclaimers readable on a phone screen.
8. Contact form and chat answer the visitor; no automated outreach to accident victims, and no lead generators that imply a recommendation.
9. Spanish pages carry their own disclaimers and link to their English versions.
10. Business Profiles follow Google’s practitioner rules and match each office page exactly.
11. Structured data matches what the page shows ([local business structured data](${LOCAL_SD})).

## How SaySites builds Houston law firm websites

SaySites builds law firm sites with this structure from the first draft: a page for each practice area, attorney profiles, an office page for each location, and a consultation form on every page whose intake questions include the other party’s name for a conflict check. Each firm is described to search engines as a LegalService, and every page must pass a 95+ speed check before it goes live. Nothing is invented. Results, certifications and languages appear only when you supply them, and you make changes by saying them in plain words, such as “add the expenses sentence under our no-fee line,” then review each one as a draft before publishing. The responsible attorney approves every word, which is what the Texas rules expect.

The Law Firm Starter plan is $79 a month ([websites for law firms](/websites-for/law-firms), [pricing](/pricing)). Have a site already? [Get a free redesign](/redesign) and see your own pages rebuilt before you decide anything, or [start a 7-day free trial](/signup) and build it yourself this week. Practicing in more than one state? Compare our guides to [Los Angeles law firm websites](/blog/los-angeles-law-firm-website-design) and [New York law firm websites after the 2026 changes](/blog/new-york-law-firm-website-rules).`,
    faq: [
      { q: 'Does a Texas law firm website have to name a lawyer?', a: 'Yes. Rule 7.02(a) of the Texas Disciplinary Rules says every advertisement of legal services must publish the name of a lawyer responsible for its content and identify that lawyer’s primary practice location. A website is an advertisement, so the safest approach is a footer line on every page, including landing pages for ads, with the attorney’s name and office location.' },
      { q: 'Do I have to file my website with the Advertising Review Committee?', a: 'Usually only the home page. Rule 7.05(b) exempts information posted on a law firm website except the home page, and the home page is exempt too if it holds only basic information listed in Rule 7.05(i), such as names, addresses, practice areas and TBLS certification. Otherwise, file it within 10 days of launch through the Advertising Review Portal.' },
      { q: 'What happens if a Houston firm doesn’t file a home page that needed filing?', a: 'The State Bar of Texas says that when it finds an unfiled advertisement that is not exempt, it may assess a $250 fine and a $100 review fee, and that failing to file a non-exempt ad also violates the Texas Disciplinary Rules. The normal filing fee is $100, so filing on time is the cheaper path.' },
      { q: 'How should a Texas lawyer word board certification on a website?', a: 'Rule 7.02(b)(1) allows a lawyer certified by the Texas Board of Legal Specialization to state, for each area, “Board Certified, area of specialization -- Texas Board of Legal Specialization.” Certifications from other organizations are allowed only if TBLS accredits them, and the certifying organization must always be named. Lawyers who aren’t certified can say they focus on an area if that is objectively true.' },
      { q: 'Can a Texas firm website say “no fee unless we win”?', a: 'Yes, with a disclosure. Rule 7.02(c) says an advertisement that mentions a contingent fee must state whether the client will have to pay other expenses, such as litigation costs. Put that sentence directly beside the claim, keep it readable on a phone, and include it in Spanish on any Spanish page, because Rule 7.01(d) requires disclaimers in each language used.' },
      { q: 'Can my firm email accident victims who visited our website?', a: 'If they contacted you first, you can answer them. Texas treats a website as a response to a request for information, not a solicitation. Unprompted written outreach about an accident is different: Penal Code section 38.12 bars written solicitations about a personal injury claim before the 31st day after the accident, and Government Code section 82.0651 adds civil penalties.' },
      { q: 'Should a Houston law firm website have Spanish pages?', a: 'Often, yes. Census figures show 47.1% of Houston residents age 5 and older speak a language other than English at home. If your team can serve Spanish-speaking clients, write real Spanish pages with a fluent reviewer, say who speaks Spanish, include every required disclaimer in Spanish, and link each page to its English version.' },
      { q: 'What does a SaySites law firm website cost?', a: 'The Law Firm Starter plan is $79 a month with a 7-day free trial. It includes practice area pages, attorney profiles, office pages, a consultation form with a conflict check question, LegalService structured data and hosting. You can also send your current site for a free redesign and see your own pages rebuilt before deciding.' },
    ],
    about: ['Texas Disciplinary Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Houston, Texas'],
    published: '2026-10-14',
    status: 'published',
  },
  {
    slug: 'denver-roofing-website-design',
    title: 'Denver Roofing Websites: Colorado Rules and Hail Season',
    description: 'What a Denver roofing company website should show under Colorado’s roofing law and Denver licensing, and how to win homeowners’ trust after a hailstorm.',
    kind: 'guide',
    summary: [
      'Colorado’s residential roofing law bars roofers from advertising or promising to pay, waive or rebate an insurance deductible, so no “we cover your deductible” anywhere on the site.',
      'Explain the contract homeowners will sign: written terms, a 72-hour cancel window, and the right to cancel within 72 hours of an insurance denial.',
      'Roofing in Denver takes a city contractor license backed by a Class D supervisor certificate; show yours and say you pull permits.',
      'Hail season sends homeowners searching fast, and the state warns them about door-to-door roofers, so a site that answers their worries beats one that just shouts “free inspection.”',
      'One service-area business profile, real job photos and honest reviews do more than a page for every suburb.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1602800458591-eddda28a498b?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown Denver’s high-rises and surrounding neighborhoods with the Rocky Mountains on the horizon' },
    body: `A roofing website in Denver earns calls by being the calm, trustworthy option after a hailstorm. It should make clear, in plain words, that you follow Colorado’s residential roofing law: you never advertise paying or waiving a homeowner’s insurance deductible, you put every job in a written contract with the cancellation rights the statute requires, and you never act as the homeowner’s public adjuster. It should show your Denver contractor license and the supervisor certificate behind it, say that you pull permits, and answer the questions homeowners ask before they let anyone on their roof. Then it needs fast pages for storm damage, replacement and repair, real photos of your own work, and a phone number that is one tap away.

This guide walks through Colorado’s roofing statute with each section linked, Denver’s licensing and permit rules, what the state tells homeowners to watch for, and how to set up Google and your pages for a metro area that gets hit by hail. It is general information, not legal advice. For questions about your own contracts or license, ask a Colorado attorney or Denver Community Planning and Development.

## What does Colorado’s roofing law mean for your website?

Colorado added a residential roofing article to its consumer protection laws in 2012, through SB 12-038 ([Colorado Revised Statutes, Title 6](${CRS6})). The Attorney General’s office has called it the Residential Roofing Bill of Rights ([Colorado Attorney General](${COAG_2019})). It applies to roofing work on residential property, generally one- and two-family homes, but not to new construction or jobs paid $1,000 or less per contract ([C.R.S. 6-22-102](${CRS_102})).

Three parts of it touch your marketing directly.

### No deductible promises, anywhere

Section 6-22-105 says a roofing contractor “shall not advertise or promise to pay, waive, or rebate all or part of any insurance deductible.” If a contractor does, the insurer is not obligated to consider the contractor’s estimate, and the homeowner or insurer can sue for damages ([C.R.S. 6-22-105](${CRS_105})).

On a website, that rules out more than the obvious “We pay your deductible!” banner. Watch for softer versions: “deductible assistance,” “we’ll work with your deductible,” a “$0 out of pocket” claim on an insurance job, or a review you’ve featured that praises a crew for covering the deductible. Colorado’s Division of Insurance tells homeowners the same thing from the other side: “Remember that you are responsible for paying the deductible amount” ([Division of Insurance advisory, 2024](${DOI_2024})). A site that says so plainly earns trust the moment a homeowner compares it with a flyer that hints otherwise.

### You can’t be the homeowner’s adjuster

The same section says a roofing contractor “shall not claim to be or act as a public insurance adjuster adjusting claims for losses or damages.” It still allows a contractor with a valid contract to discuss the scope of repairs with the insurer ([C.R.S. 6-22-105](${CRS_105})).

So “we handle your insurance claim for you” and “we negotiate with your adjuster” are wording to avoid. “We document the damage with photos, meet your adjuster on the roof, and walk them through the repairs we’ve agreed with you” describes the help you can lawfully give.

### Tell people what the contract will say

Section 6-22-103 requires a written, signed contract before any roofing work. It must include the scope of work and materials, approximate dates, approximate costs based on damage known at signing, your physical address, email and phone, your surety and liability insurer if applicable, a cancellation and refund policy with the right to rescind and get a full deposit refund within seventy-two hours of signing, a statement of the separate right to rescind after an insurance denial, and a statement that you can’t pay, waive or rebate the deductible. A bold-faced statement must also say you hold the homeowner’s payment in trust until materials are delivered or most of the work is done ([C.R.S. 6-22-103](${CRS_103})).

Section 6-22-104 adds that homeowners may cancel within seventy-two hours after receiving written notice that their insurer denied the claim in whole or in part, and that the contractor must return payments within ten days, minus pay for work actually performed ([C.R.S. 6-22-104](${CRS_104})).

None of this needs to be hidden in fine print. A short “What you’ll sign” section on your insurance and storm damage pages, in plain language, does three jobs: it shows you know the law, it answers the worries homeowners bring, and it filters out callers who want a deductible deal you can’t give.

![Roofer in jeans and a work shirt bending over to fasten asphalt shingles on a pitched residential roof](https://images.unsplash.com/photo-1633759593085-1eaeb724fc88?auto=format&fit=crop&w=1200&q=75)

## What licenses should a Denver roofer show on the website?

Colorado’s roofing article doesn’t set up a statewide roofing license or registration. The state’s own fraud prevention site tells homeowners to “check with your city or county to make sure the general contractor is licensed to work in your area,” noting that electrical and plumbing licenses are the ones regulated by the state ([Stop Fraud Colorado](${STOPFRAUD})). In Denver, that local check is real.

Denver requires a contractor license, and before applying an applicant “must hold a supervisor certificate, employ a supervisor certificate holder, or hold a Colorado electrical or plumbing license” ([Denver contractor licenses](${DEN_LICENSE})). For roofers, the relevant certificates are Class D specialty certificates: Roofing-Shingles for residential work, done under the on-site supervision of a Class D Roofing-Shingles supervisor certificate holder; Roof Covering and Waterproofing for commercial and residential low-slope work; and a Metal Roof Installer certificate ([Denver Class D certificates](${DEN_CLASSD})).

The city’s roofing guide adds permit details worth reflecting in your copy. Repairs on buildings under 25,000 square feet need a permit when they cover more than 10% of the roof area or two roof squares, whichever is smaller; all new roof penetrations need a permit; existing roofs must be torn off to the deck where two or more layers already exist; and membrane roofs must be installed by a contractor holding the roof covering and waterproofing license ([Denver roofing guide](${DEN_ROOF_GUIDE})). The guide even sets minimum shingle wind ratings by area, rising from 115 mph east of Federal Boulevard to 140 mph between Sheridan and Kipling.

On the site, that becomes a short “Licensed in Denver” block near the top of the home page and every service page:

- Your company’s Denver contractor license class and number, and the supervisor certificate type that backs it.
- A sentence saying you pull the required permits and pass the city’s inspections.
- The other cities and counties where you hold licenses, if you work outside Denver.
- Your liability insurance carrier, since the statute already asks you to name it in contracts.

Stop Fraud Colorado lists “refusing to pull required local permits” as a red flag, so a homeowner who reads “we pull every permit” is reading the opposite of a red flag. Want to see your own site with that block in place? Ask for a [free redesign](/redesign) and we’ll rebuild your current pages so you can compare, at no cost.

## How does hail season change what Denver homeowners search for?

Hail sends people online in a hurry. The National Weather Service’s Colorado severe weather materials say “some of the biggest insurance losses each year are due to large hail,” and that Colorado hailstones range from pea size to softball size, around 4 1/2 inches across ([NWS Colorado Severe Weather Awareness Week](${NWS_GLD})). Locals remember storms like May 8, 2017, when the NWS Boulder office reported hail up to baseball size around Golden, Lakewood, Wheat Ridge and northwest Denver, with dented cars, shattered windows and “considerable roof damage” ([NWS Boulder storm report](${NWS_2017})). Colorado State University’s climate experts describe hail picking up in late April and early May, with severe hail days peaking in early to mid-June and tapering through July and August ([Colorado State University](${CSU_HAIL})).

Homeowners also arrive wary. After a 2024 storm hit metro Denver, the Division of Insurance warned that after storms “roofing contractors and other construction contractors start door-to-door sales or phone solicitations,” and told homeowners to get everything in writing ([Division of Insurance advisory, 2024](${DOI_2024})). The Attorney General’s consumer alert puts it more bluntly: “NEVER allow an uninvited contractor to inspect your home or your roof” ([Attorney General consumer alert](${COAG_ALERT})). And the Division notes that many policies now carry wind and hail deductibles set as a percentage of coverage, such as 1%, 2% or 5%, and that if damage is below the deductible, the insurer won’t pay ([Division of Insurance advisory, 2025](${DOI_2025})).

Put those together and the storm damage page that works is the one that reassures:

1. **Lead with what to do first.** Photograph the damage from the ground, tarp only if safe, call the insurer, and get a written estimate before signing anything.
2. **Explain the deductible honestly.** A percentage deductible can be large, and a small repair may fall under it. Saying so loses you nothing and builds trust with the homeowner who checks.
3. **Show your process.** Inspection, photos shared with the homeowner, the written contract, the adjuster meeting, permits, the work, the final inspection.
4. **Say you are local and permanent.** Your office address, how long you’ve worked in Denver, and how warranty calls reach you after the trucks leave.
5. **Make the call easy.** A tap-to-call number at the top of every page, and a short form asking how soon they need you and the ZIP code of the job.

![Close-up of a hand holding several jagged white hailstones above a lawn covered in ice](https://images.unsplash.com/photo-1606588347049-62bfd0c118d5?auto=format&fit=crop&w=1200&q=75)

## Which pages should a Denver roofing website have?

Homeowners with one missing shingle and homeowners pricing a full tear-off want different things, and Google ranks pages, not whole sites. A practical page list:

- **Home:** what you do, where you work, the license block, a tap-to-call number and a few real project photos.
- **Storm and hail damage:** the reassuring page described above, with the contract and deductible facts.
- **Roof replacement:** materials you install (asphalt shingles, metal, low-slope membranes if you hold that certificate), how long a typical job takes, what the permit and inspection steps are.
- **Roof repair:** leaks, flashing, missing shingles, and when repair is enough.
- **Insurance claims explained:** what you can and can’t do under Colorado law, written plainly.
- **Projects:** your own before-and-after photos, by neighborhood or roof type, with a line on what was done.
- **About:** owner, crew, years in Denver, licenses, insurance, warranty.
- **Service area and contact:** the cities and counties you serve, hours and a form.

Each page should carry its own title and heading that match how people actually search, like “hail damage roof repair in Denver” or “roof replacement in Aurora.” What doesn’t work is cloning the replacement page twenty times with a new suburb name swapped in. Google’s spam policies treat those near-identical location pages as doorway abuse ([spam policies](${SPAM})). Write about a suburb only when you have something real to say, such as a neighborhood where you’ve replaced dozens of roofs after one storm, with photos to show it.

If your crew and office serve Spanish-speaking homeowners, a Spanish version is worth building. Census figures show 23.9% of Denver residents age 5 and older speak a language other than English at home, and 28.0% are Hispanic or Latino ([Census QuickFacts](${CENSUS_DEN})). Have a fluent speaker write it, and make sure the contract summary and deductible facts are just as clear in Spanish.

## How should a Denver roofer set up Google Business Profile and reviews?

Most roofers are service-area businesses: you go to the customer. Google’s rules for that setup are specific. If you don’t serve customers at your business address, remove it from your profile; you can list up to 20 service areas; the overall area shouldn’t extend beyond about two hours’ drive from your base; you can’t set a radius; and a service-area business can only have one profile for the whole area it serves ([Google service areas](${SERVICE_AREAS})). Our guide on [showing Google where you work without a storefront](/blog/service-area-business-google) walks through it step by step.

Reviews matter even more after a storm, when homeowners compare three or four roofers in an evening. Google’s policy treats reviews that were paid for, “directly or in kind,” as fake engagement, and bars businesses from offering discounts or free services for reviews, discouraging negative reviews, or selectively asking only happy customers ([Google Maps content policy](${MAPS_POLICY})). Ask every customer, the same way, after the job passes inspection. Our guide to [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) has wording you can use.

If you run Google Local Services Ads, Google lists roofing as a category and screens roofers for insurance and, where required, licenses, and requires a verified Business Profile ([Local Services screening](${LSA_US})). Keep the name, phone and service area on your website identical to the profile, so the two reinforce each other.

![Roofer carrying a bundle of shingles across a pitched roof, with stacked shingle packs and a tree branch nearby](https://images.unsplash.com/photo-1643225523483-e2c434191bba?auto=format&fit=crop&w=1200&q=75)

## A launch checklist for a Denver roofing website

1. No deductible offers in any form, including in featured reviews and ad landing pages.
2. No claims to handle or adjust the homeowner’s insurance claim; describe documenting damage and meeting the adjuster instead.
3. A plain-language “What you’ll sign” section covering the written contract, the 72-hour cancel window, the right to cancel within 72 hours of an insurance denial, and funds held in trust.
4. Denver contractor license and supervisor certificate shown near the top, plus other cities where you’re licensed.
5. A clear statement that you pull permits and pass inspections.
6. A storm damage page that tells homeowners what to do first and explains percentage deductibles honestly.
7. Separate pages for replacement, repair and storm damage, each with its own title and heading.
8. Real project photos, not stock, on the projects page and service pages.
9. A tap-to-call number on every page and a short job request form.
10. One service-area Business Profile matching the site exactly, and the same review request for every customer.
11. Spanish pages only if someone on your team can serve those customers.
12. Pages that load fast on a phone; check with a [speed test](${PAGESPEED}).

## How SaySites helps Denver roofers

SaySites builds roofing websites with this layout from the start: separate pages for replacement, repair and storm damage, each with its own title and heading, a tap-to-call number, a job request form that asks how soon the homeowner needs you, the job’s ZIP code and whether they own or rent, and structured data that describes your company as a RoofingContractor. Your own photos are resized automatically, and every page has to pass a 95+ speed check before it can go live. Nothing gets made up: licenses, warranties, reviews and project photos come only from you. You change anything by saying it in plain words, like “add our Denver license number under the phone number” or “put a section on our storm page about what homeowners sign,” and you see it as a draft before it publishes.

Leads land in a simple pipeline where you can call, text, email and follow up, with an instant reply to each homeowner if you turn it on. The Site plan is $15 a month ([websites for roofers](/websites-for/roofers), [pricing](/pricing)). [Start a 7-day free trial](/signup) and have your storm damage page up before the next hail season, or [get a free redesign](/redesign) of your current site and see the difference first. Running a trade business in a hot-weather market? See our guide to [Phoenix HVAC websites](/blog/phoenix-hvac-website-design) for how licensing rules shape another trade’s site.`,
    faq: [
      { q: 'Can a Colorado roofer offer to cover a homeowner’s insurance deductible?', a: 'No. Colorado Revised Statutes section 6-22-105 says a roofing contractor shall not advertise or promise to pay, waive or rebate all or part of an insurance deductible. If a contractor does, the insurer doesn’t have to consider that contractor’s estimate, and the homeowner or insurer can sue for damages. Keep any deductible offer, however softly worded, off your website and ads.' },
      { q: 'What must a Colorado residential roofing contract include?', a: 'Section 6-22-103 requires a signed written contract before work starts, covering scope and materials, approximate dates and costs, your contact details and insurer, a 72-hour right to rescind with a full deposit refund, the right to cancel after an insurance denial, a no-deductible-waiver statement, and a bold statement that you hold payments in trust until materials arrive or most work is done.' },
      { q: 'Can a homeowner cancel a roofing contract if insurance denies the claim?', a: 'Yes. Under section 6-22-104, a homeowner may cancel within 72 hours after receiving written notice that the insurer denied the claim in whole or in part. The roofer must return payments within ten days, though it may keep payment for work actually performed. Explaining this on your storm damage page shows homeowners you know the law.' },
      { q: 'Does a roofer need a license to work in Denver?', a: 'Yes. Denver requires a contractor license, and applicants must hold or employ a supervisor certificate holder first. Residential shingle work falls under a Class D Roofing-Shingles certificate, low-slope and membrane work under a Class D Roof Covering and Waterproofing certificate. Other Colorado cities set their own rules, so list each license you hold on your website.' },
      { q: 'Can my roofing company handle the homeowner’s insurance claim?', a: 'Not as their adjuster. Section 6-22-105 bars roofing contractors from claiming to be or acting as a public insurance adjuster. With a valid contract, you can still discuss the scope of repairs with the insurer. On your website, describe documenting damage, sharing photos and meeting the adjuster rather than promising to handle the claim.' },
      { q: 'Should a Denver roofer make a page for every suburb?', a: 'No. Near-identical pages that only swap a suburb name fall under Google’s doorway abuse policy and can hurt the whole site. Build strong pages for storm damage, replacement and repair, list your service area clearly, and add a local page only when you have real substance, such as photos and details from many jobs in one neighborhood.' },
      { q: 'How much does a SaySites roofing website cost?', a: 'The Site plan is $15 a month with a 7-day free trial. It includes separate pages for replacement, repair and storm damage, a tap-to-call number, a job request form, RoofingContractor structured data, a leads pipeline and hosting. You can also ask for a free redesign and see your current site rebuilt before you decide anything.' },
    ],
    about: ['Colorado residential roofing law', 'Roofing contractor websites', 'Hail damage', 'Denver, Colorado'],
    published: '2026-10-14',
    status: 'published',
  },
  {
    slug: 'los-angeles-law-firm-website-design',
    title: 'Los Angeles Law Firm Website Design: California Rules',
    description: 'What a Los Angeles law firm website must show under California’s ad rules, what it can’t say, and how to build one for a bilingual, 88-city market.',
    kind: 'guide',
    summary: [
      'California treats a law firm website as advertising: Rule 7.2 requires the name and address of at least one lawyer or firm responsible for its content.',
      'No guarantees or “quick settlement” promises; since January 1, 2026, no award badges from groups that charge for them or give them for membership.',
      '“Certified specialist” is reserved for lawyers certified by the State Bar’s program or another State Bar accredited body, and the certifier must be named.',
      'More than half of Los Angeles residents speak a language other than English at home; offer another language only if a named role at the firm really speaks it.',
      'Build one page per real office and practice area, not a copy for each of the county’s 88 cities.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1600621895391-0a5ac353d1b6?auto=format&fit=crop&w=1600&q=75', alt: 'Los Angeles City Hall’s white tower rising above a wide plaza with palm trees and pedestrians on a sunny day' },
    body: `A good law firm website in Los Angeles does two jobs at once. It follows California’s attorney advertising rules, which treat your website as a communication about your services, and it turns a stressed, often bilingual visitor on a phone into a consultation request. In practice that means: name a responsible lawyer and an address on the site, never promise results, say “certified specialist” only when the State Bar’s program or another State Bar accredited body certified you, offer Spanish or another language only when someone at the firm really speaks it, and build a separate page for each practice area and courthouse reality your clients face.

This guide walks through each of those points with the rule or statute linked, then covers how Los Angeles clients search, how to handle a county with 88 cities without spammy location pages, and a checklist you can hand to whoever builds your site. It is general information, not legal or ethics advice; for a question about your own advertising, the State Bar of California’s ethics resources are the place to go.

## Does California treat a law firm website as advertising?

Yes. The State Bar’s ethics committee answered this directly in Formal Opinion 2001-155: an attorney website is a “communication” under the professional rules and an “advertisement” under the Business and Professions Code, but not a “solicitation,” even when it lets visitors send email ([Formal Opinion 2001-155](${CA_OP_2001})). The opinion cites the rules in force at the time, so read it for the reasoning rather than the rule numbers.

The current rules say the same thing in their own words. Rule 7.1 covers “all communications of any type whatsoever,” and the comment to Rule 7.3 says a communication aimed at the general public, such as a website or an internet banner ad, is not a solicitation ([California Rules of Professional Conduct, Chapter 7](${CA_CH7})). So your site has to meet the advertising rules, and it does not trigger the stricter solicitation rules just by existing.

The statutes add their own layer. Business and Professions Code section 6157 defines an “electronic medium” to include computer networks ([B&P § 6157](${BPC_6157})), and section 6158 says that in electronic media advertising the message as a whole may not be false, misleading or deceptive and must be factually substantiated ([B&P § 6158](${BPC_6158})).

## What must a California law firm website include?

The one firm requirement in the rules themselves is short. Rule 7.2(c) says any communication made under the advertising rule “shall include the name and address of at least one lawyer or law firm responsible for its content” ([Rule 7.2](${CA_CH7})).

Since January 1, 2026, the Business and Professions Code adds its own version. As amended by SB 37, section 6157.2(b) says an advertisement must conspicuously display the name of at least one lawyer licensed in California or the responsible firm, and the city, town or county of at least one bona fide office or the address of record listed with the State Bar ([B&P § 6157.2](${BPC_6157_2})).

On a website, the clean way to meet both is a line in the footer of every page with the firm name and its office address, plus an About or Contact page that names the responsible attorney. Many firms already show their address for Google; the point is to make sure it appears on every page that advertises, including landing pages built for ads.

Two statutes are worth knowing because they shape what goes on the page:

- **Keep a copy.** Section 6159.1 requires a true and correct copy of an advertisement to be kept for one year ([B&P § 6159.1](${BPC_6159_1})). For a website that changes often, the safest habit is a dated copy of each version of your key pages, kept outside the website itself.
- **Contingency fees and costs.** Section 6157.2 says a statement that you work on a contingent basis must also say whether the client will be responsible for costs you advanced when there is no recovery; if the client won’t be, no disclosure is needed ([B&P § 6157.2](${BPC_6157_2})). Comment [3] to Rule 7.1 says anything that states or implies “no fee without recovery” is misleading unless it discloses whether the client will be liable for costs ([Rule 7.1](${CA_CH7})).

If your home page says “No fee unless we win,” the costs sentence belongs right next to it, not on a separate page.

Not sure your current site gets these right? Send us the address for a [free redesign](/redesign) and you’ll see your own pages rebuilt with these basics in place, at no cost and with no commitment.

## What can’t a Los Angeles law firm say on its website?

Rule 7.1(a) is the core: “A lawyer shall not make a false or misleading communication about the lawyer or the lawyer’s services” ([Rule 7.1](${CA_CH7})). The comments turn that into specifics that matter for websites.

### Guarantees and predictions

Comment [2] to Rule 7.1 says a communication containing an express guarantee or warranty of the result of a particular representation is false or misleading. The statute is even more pointed: section 6157.2 bars any guarantee or warranty of success regarding the outcome of a legal matter, and statements promising immediate cash or quick settlements ([B&P § 6157.2](${BPC_6157_2})).

On a real site, that rules out headlines like “We win or you don’t pay a dime” without the costs disclosure, “Get your settlement fast,” and “We will get you the maximum.” Plain, true statements work better anyway: what the firm handles, who handles it, how a consultation works.

### Case results and client reviews

Comment [4] to Rule 7.1 says past results and testimonials may be misleading if they lead a reasonable person to form an unjustified expectation, and that an appropriate disclaimer or qualifying language often avoids that ([Rule 7.1](${CA_CH7})). Before 2018, California had a formal list of “standards” presumed to violate the old advertising rule, including testimonials without a disclaimer and dramatizations without a notice. Those standards were not carried into the current rules; the commission that rewrote them recommended dropping them ([Rules revision commission report](${CA_RRC_71})), and they now live only in the archive of former Rule 1-400 ([former Rule 1-400](${CA_1400})). The ideas behind them still appear in the comments and in section 6157.2, which requires a disclosure when an ad uses a dramatization or impersonation.

For a results page, that means:

1. Use real results only, with the client’s permission where confidentiality requires it.
2. Give context: the type of case, what was recovered or achieved, and, where it matters, what the client’s costs were.
3. Put a short, visible qualifier near the results (for example, that every case is different and past results do not guarantee a future outcome), not hidden at the bottom of the page.
4. Never use an actor or a reenactment without saying so.

### Awards, badges and “top lawyer” logos

The 2026 amendment also reaches the badges many firm sites display. Section 6157.2(a)(6) now bars references to a lawyer’s or firm’s recognition by, or awards from, an organization unless the recognition isn’t conferred just for being a member, and the organization doesn’t charge or solicit a fee, cost or payment for it. The same section bars misleading statements about a lawyer’s or firm’s skills, experience or record ([B&P § 6157.2](${BPC_6157_2})).

That makes a badge audit worth an afternoon. For each award logo on your site, find out how it was earned and whether the organization charged anything for the award, a listing or a plaque. If you can’t confirm both conditions, take it down. The stakes are higher than a bar complaint: the amended section lets a consumer who was misled by an ad that violates it bring a civil action, after a State Bar complaint process, for statutory damages of $5,000 to $100,000 per unique advertisement or three times actual damages, whichever is larger ([B&P § 6157.2](${BPC_6157_2})).

### Specialist and expertise claims

Rule 7.4 allows a lawyer to say a practice “specializes in, is limited to, or is concentrated in” a field, subject to Rule 7.1. Calling yourself a **certified specialist** is different: it is allowed only if you are certified by the State Bar’s Board of Legal Specialization or another entity accredited by the State Bar, and the communication clearly names the certifying organization ([Rule 7.4](${CA_CH7})).

The State Bar currently certifies specialists in twelve areas: admiralty and maritime, appellate, bankruptcy, criminal, estate planning, trust and probate, family, franchise and distribution, immigration and nationality, legal malpractice, privacy law, taxation, and workers’ compensation ([legal specialty areas](${CA_SPEC_AREAS})). If an attorney at your firm holds one of these, say so on their profile with the certifying body named and a link to the State Bar’s certified specialist search, where anyone can confirm it ([find a certified specialist](${CA_SPEC_FIND})). If no one does, use “practice focused on” or “concentrating in” instead.

### Firm names, domains and logos

Rule 7.5 bars a firm name, trade name or other professional designation that violates Rule 7.1 or implies a connection with a government agency or a legal services organization. Its comment says “other professional designation” includes logos, letterheads, URLs and signature blocks ([Rule 7.5](${CA_CH7})). A domain like “lacountyinjuryhelp” for a private firm, or a seal-style logo that looks official, is worth a second look before you buy it.

## Does the website need a Spanish version?

For many Los Angeles firms, real Spanish pages are one of the most useful things a site can add, but only if the firm can serve those clients. Census Bureau figures for 2020 to 2024 show that 56.4% of Los Angeles city residents age 5 and older speak a language other than English at home, and 55.1% in Los Angeles County; 47.2% of city residents and 49.3% of county residents are Hispanic or Latino ([Census QuickFacts](${CENSUS_LA})).

California’s rules address language directly. Comment [5] to Rule 7.1 says a lawyer may not claim to provide services in a language other than English unless the lawyer can actually do so, or the communication states the employment title of the person who speaks the language ([Rule 7.1](${CA_CH7})). So “Se habla español” is fine if an attorney speaks Spanish; if a paralegal or intake coordinator does, say that (“Our intake coordinator speaks Spanish”).

For the pages themselves:

- Write or review the Spanish pages with a fluent speaker who knows legal terms. Machine translation of a practice page tends to read badly and can change the meaning of a disclaimer.
- Translate the disclaimers, the costs disclosure and the responsible lawyer line too. A Spanish page that drops them is a separate advertisement missing required parts.
- Link each Spanish page to its English version so Google can show the right one to each searcher ([localized versions](${HREFLANG})).
- If your team also serves Korean, Armenian, Tagalog, Chinese or other language communities, the same rules and the same honesty apply to each.

![Downtown Los Angeles skyline with glass towers in front of the San Gabriel Mountains under a hazy sky](https://images.unsplash.com/photo-1638059957884-2faffe7b6943?auto=format&fit=crop&w=1200&q=75)

## How do Los Angeles clients search for a lawyer?

Los Angeles is a crowded legal market. The State Bar’s county breakdown lists 58,838 active licensees in Los Angeles County ([State Bar county figures](${CA_BAR_COUNTIES})), and the statewide count of active licensees was 201,250 as of October 11, 2026 ([State Bar demographics](${CA_BAR_DEMO})). A site that says “we handle all types of cases” is competing with all of them at once.

What helps a searcher, and Google, is specificity. People search by problem and by place: “wrongful termination lawyer in Glendale,” “DUI attorney near the Van Nuys courthouse,” “abogado de accidentes en East LA.” The court landscape gives you real, local detail to write about. The Superior Court of Los Angeles County describes itself as the largest trial court in the nation, serving a population of almost 10 million in 36 courthouses spread over more than 4,000 square miles and 88 cities ([Los Angeles Superior Court](${LASC_RELEASE})). Federal cases go to the Central District of California, which covers Los Angeles and six neighboring counties in Western, Southern and Eastern divisions ([Central District of California profile](${CACD_PROFILE})).

Useful, local content for a firm’s site might include:

- **For a criminal defense firm:** which courthouses you appear in regularly, what happens at an arraignment there, and what a client should bring.
- **For a family law firm:** how the process starts, where filings go for your clients, and what a first consultation covers.
- **For a personal injury firm:** what to do in the first days after a crash, how medical records and insurance claims fit together, and how your fee and costs work, stated clearly.
- **For an employment firm:** the agencies and deadlines involved, linked to the official sources.

Write these from real experience. A short, accurate page about how your firm handles a matter at a specific courthouse is more useful to a client than a generic 3,000-word page about the law in general, and Google’s guidance on [helpful, people-first content](${HELPFUL}) asks for exactly that kind of first-hand expertise.

## How should a firm cover 88 cities without spam pages?

The tempting move is a page for every city in the county: “Personal Injury Lawyer in Pasadena,” “in Long Beach,” “in Torrance,” each with the same text and a new name. Google’s spam policies name this pattern as doorway abuse and also warn against scaled content abuse, meaning many pages produced mainly to rank rather than to help ([Google spam policies](${SPAM})). It can hurt the whole site, not just those pages.

A structure that works better:

1. **One page per office you actually have.** Address, hours, parking or transit notes, the attorneys who work there, a map. If you meet clients in Century City and Long Beach, those are two real pages.
2. **One page per practice area,** each with its own substance.
3. **Local detail where it is real:** a page about a courthouse you appear in, a neighborhood your firm has served for years, or a community you serve in its own language.
4. **A plain service-area statement** on the contact page listing where you take cases.

## Google Business Profile for Los Angeles lawyers

Google treats lawyers as individual practitioners. Its guidelines say a practitioner can have their own Business Profile if they work in a public-facing role and can be contacted at the verified location during stated hours, and that the profile title should include only the practitioner’s name. When several practitioners work at one location, the firm should have its own profile for that location, separate from each practitioner’s. And a practitioner should not have multiple profiles to cover each specialization ([Google Business Profile guidelines](${GBP_GUIDELINES})).

For a multi-office LA firm, that usually means one profile per staffed office, attorney profiles only where they meet the practitioner test, and the exact same name, address and phone on the website’s office page as on the profile. Our guide to [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) explains why relevance, distance and prominence matter here.

![Pen in hand signing a printed document on a desk, in soft natural light](https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=75)

## Can a law firm website use chat, AI or intake forms?

Yes, with care. The State Bar has published practical guidance on generative AI that focuses on competence, confidentiality and supervision ([State Bar generative AI guidance](${CA_GENAI})). It does not carve out a special rule for website chat, so the ordinary rules apply: what a chatbot says on your site is still your firm’s communication under Rule 7.1, and a chat or form that collects case details raises confidentiality questions.

On the intake side, practical steps:

- Keep the first form short: name, phone or email, what happened in a sentence or two, and the other party’s name so you can run a conflict check before anyone shares details.
- Say on the form that submitting it does not create an attorney-client relationship and that visitors shouldn’t send confidential information until you confirm you can take the matter.
- Answer fast. A visitor who filled in your form at 9 p.m. has often filled in two others.

One rule change in 2026 touches online outreach. The California Supreme Court amended Rule 7.3, effective June 1, 2026, to bar lawyers from soliciting the respondent in an ex parte domestic violence restraining order case before that person is served, unless the respondent is a current or former client ([California courts newsroom](${CA_DVRO})). Family law firms that run targeted ads or outreach should review that change; an ordinary website is still not a solicitation.

## Which pages should a Los Angeles law firm website have?

A practical page list, adjusted to your practice:

- **Home:** what you do and for whom, where your offices are, how to reach you, and the responsible lawyer and address line.
- **A page for each practice area,** written by or with the attorney who handles that work.
- **Attorney profiles:** education, bar admission, years in practice, languages actually spoken, and any State Bar certified specialist designation with the certifying body named.
- **Results and reviews,** if you use them, with context and a visible qualifier.
- **Office pages,** one per real location.
- **Spanish (and other language) pages** where you have the staff to serve them.
- **Fees:** how consultations work and, for contingency matters, whether the client pays costs if there is no recovery.
- **Contact:** a short form, phone, address and hours.

Behind the pages, structured data should describe the firm with the details the page shows: name, address, phone, hours and practice areas, using Google’s local business properties ([local business structured data](${LOCAL_SD})). Never mark up reviews or claims the page doesn’t show.

![Modern conference room with a long wooden table, leather chairs and glass walls](https://images.unsplash.com/photo-1571624436279-b272aff752b5?auto=format&fit=crop&w=1200&q=75)

## A checklist before your Los Angeles firm’s site goes live

1. Firm name and office address on every page, conspicuously shown; a responsible California lawyer named on the About or Contact page.
2. No guarantees, no “quick settlement” or “immediate cash” language, and no award badges from organizations that charge for them or hand them out for membership.
3. Any “no fee unless we win” claim sits next to a clear statement of whether the client pays costs if there is no recovery.
4. Results and testimonials are real, permitted, in context and visibly qualified; dramatizations are labeled.
5. “Certified specialist” appears only for State Bar certified attorneys, with the certifying body named.
6. Languages are offered only where a named role at the firm really speaks them, and translated pages carry the same disclaimers.
7. Domain, firm name and logo don’t suggest a government or legal aid connection.
8. One page per real office, one per practice area; no near-identical city pages.
9. Business Profiles follow Google’s practitioner rules and match the site exactly.
10. Intake form is short, includes a conflict-check question and a no-relationship notice.
11. A dated copy of each version of the site’s advertising pages is kept for at least a year.
12. The site loads fast on a phone and passes a [speed test](${PAGESPEED}).

## Where SaySites fits

SaySites builds law firm websites with this structure from the start: a page for each practice area, attorney profiles, office details Google can read, and a consultation request on every page with intake questions that include the other party’s name for a conflict check. Each firm is described to search engines as a LegalService, and every page has to pass a 95+ speed check before it can go live. Nothing is invented: results, reviews, languages and certifications appear only if you give them to us. You make changes by saying them in plain words, like “add our costs disclosure under the no-fee line,” and see each one as a draft before you publish it, so the attorney responsible for the content approves every word.

The Law Firm Starter plan is $79 a month ([websites for law firms](/websites-for/law-firms), [pricing](/pricing)). Already have a site? [Get a free redesign](/redesign) and see your current pages rebuilt before you decide anything, or [start a 7-day free trial](/signup) and build it yourself. If you also practice in other states, compare the rules in our guides to [New York law firm websites after the 2026 changes](/blog/new-york-law-firm-website-rules) and [Florida law firm websites](/blog/law-firm-website-design-florida).`,
    faq: [
      { q: 'Does California consider my law firm website an advertisement?', a: 'Yes. The State Bar’s Formal Opinion 2001-155 treats an attorney website as a communication under the professional rules and an advertisement under the Business and Professions Code, though not a solicitation. The current Rule 7.1 covers communications of any type, so everything on your site, from the home page to attorney bios and results, has to be truthful and not misleading.' },
      { q: 'What does Rule 7.2 require on a California law firm website?', a: 'Rule 7.2(c) requires any advertising communication to include the name and address of at least one lawyer or law firm responsible for its content. On a website, the simplest approach is the firm name and office address in the footer of every page, with the responsible attorney named on the About or Contact page, including on any landing pages used for ads.' },
      { q: 'Can my firm say “no fee unless we win” on its website?', a: 'Only with a clear costs disclosure. Comment 3 to Rule 7.1 says a communication stating or implying no fee without recovery is misleading unless it says whether the client will be liable for costs, and Business and Professions Code section 6157.2 requires contingency fee statements to say whether clients pay advanced costs when there is no recovery. Put that sentence right next to the claim.' },
      { q: 'Can our website show “best lawyer” or award badges?', a: 'Only some. Since January 1, 2026, Business and Professions Code section 6157.2 bars references to recognition or awards unless the award isn’t given simply for membership and the organization doesn’t charge or solicit a fee for it. Check how each badge on your site was earned and whether anything was paid, and remove any you can’t confirm.' },
      { q: 'When can a Los Angeles lawyer call themselves a certified specialist?', a: 'Only when certified by the State Bar’s Board of Legal Specialization or another entity the State Bar accredits, and the certifying organization must be named. The State Bar certifies twelve areas, including criminal, family, immigration and workers’ compensation law. Otherwise, Rule 7.4 lets you say a practice specializes in, is limited to, or concentrates in a field.' },
      { q: 'Can we advertise that our firm speaks Spanish?', a: 'Yes, if it is true. Comment 5 to Rule 7.1 says a lawyer may not claim to provide services in another language unless the lawyer can, or the communication states the job title of the person who speaks it, such as an intake coordinator. Translate the disclaimers and costs disclosure along with the rest of each Spanish page.' },
      { q: 'Should a Los Angeles firm make a page for every city it serves?', a: 'Usually not. Near-identical city pages with only the name changed fall under Google’s doorway and scaled content abuse policies. Build one page for each office you really have, one for each practice area, and local pages only where you have real substance, such as a courthouse you appear in regularly or a community you serve in its language.' },
      { q: 'How much does a law firm website from SaySites cost?', a: 'The Law Firm Starter plan is $79 a month and includes a page for each practice area, attorney profiles, intake with a conflict check question, structured data and hosting, with a 7-day free trial. You can also send your current site for a free redesign preview and see your own pages rebuilt before you decide anything.' },
    ],
    about: ['California Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Los Angeles, California'],
    published: '2026-10-13',
    status: 'published',
  },
  {
    slug: 'chicago-plumber-website-design',
    title: 'Chicago Plumber Websites: License Rules to Winter Calls',
    description: 'What a Chicago plumbing website should show under Illinois and city license rules, plus pages for lead lines, flooding, frozen pipes and Spanish speakers.',
    kind: 'guide',
    summary: [
      'Illinois law bars advertising plumbing services without the license number in the ad; show it on your website’s home page near the phone number.',
      'Working in the city takes a City of Chicago plumbing contractor license on top of the state license, so list both in a “Licensed and insured” block.',
      'Lead service line replacement, basement flooding and frozen pipes are the Chicago jobs that deserve their own pages, linked to the city’s official programs.',
      'Real Spanish pages, one honest service-area page and Plumber structured data finish a site built for Chicago and the suburbs.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1614734292826-78010d348dfc?auto=format&fit=crop&w=1600&q=75', alt: 'Snow-covered residential street lined with brick buildings, bare trees and parked cars buried after a winter storm' },
    body: `A plumbing website in Chicago has to work for two kinds of customer: the homeowner standing in a wet basement after a storm, and the one quietly researching what it takes to replace a lead service line. Both need a phone number they can tap, proof you are licensed, and plain answers. Illinois law also puts your license number in your plumbing advertising, and Chicago adds its own contractor license on top of the state’s, so the site should show both clearly. Build the rest around the jobs Chicago actually produces: frozen pipes, flood control, lead line replacement and old housing stock, with honest Spanish pages if your crew serves Spanish-speaking customers.

This guide covers the license rules with the statutes linked, the local problems worth a page of their own, how to cover the city and suburbs without spam pages, and a checklist at the end. It is general information, not legal advice; for questions about your own license or ads, the Illinois Department of Public Health and the City of Chicago Department of Buildings are the authorities.

## Does Illinois require a license number on plumbing ads?

Yes. Section 5 of the Illinois Plumbing License Law says that people who advertise plumbing services must display the licensed plumber’s license at their place of business, that the number must be included with the plumbing identification on vehicles, and that no one who provides plumbing services may advertise them unless the advertisement includes that license number ([225 ILCS 320/5](${ILCS_5})).

The penalties are real. A violation is a Class A misdemeanor with a $1,000 fine, and each day an ad runs in violation counts as a separate offense. The law also lets the Department of Public Health, after notice and a hearing, order a phone company to disconnect numbers listed in unlawful printed plumbing ads ([225 ILCS 320/5](${ILCS_5})).

The statute speaks of “advertisement” and printed ads; it doesn’t mention websites by name. But a plumbing company’s website exists to advertise its services, and putting the license number on it costs nothing. The sensible reading is to treat the site like any other ad: show the license number on the home page near your phone number, and repeat it on the contact page and in the footer.

## Who has to be licensed, and what about Chicago’s own license?

Illinois requires that plumbing, and the planning and design of plumbing systems, be done only by licensed plumbers, and that employees of a plumbing firm who do plumbing be licensed too. A homeowner can do plumbing on their own single-family home, but can’t hire anyone other than a licensed plumber to do it ([225 ILCS 320/3](${ILCS_3})). Businesses that work as plumbing contractors register with the Department of Public Health ([225 ILCS 320/13.1](${ILCS_13_1})), and the department says contractors register every year and must carry liability and workers’ compensation insurance ([IDPH plumbing program](${IDPH_PLUMB})).

Chicago adds a layer. The city’s Department of Buildings says a City of Chicago plumbing contractor license is required to install, alter, repair or maintain plumbing in the city, and that a contractor licensed by the state must also get the city license. At least one principal must be a city-licensed plumber, the contractor files a $20,000 performance bond payable to the city, and the license runs for one year. The page cites Chapters 4-332 and 4-336 of the Municipal Code ([Chicago plumbing contractor license](${CHI_PL})). The state law also connects the two: if the state suspends or revokes a contractor’s registration, it notifies the city, and the matching Chicago license is suspended or revoked too ([225 ILCS 320/13.1](${ILCS_13_1})).

For your website, that suggests a short “Licensed and insured” block that lists:

- your Illinois plumber license number;
- your IDPH plumbing contractor registration, if you have one;
- your City of Chicago plumbing contractor license, if you work in the city;
- a line saying you carry liability and workers’ compensation insurance, which the state already requires of registered contractors;
- a link to the Department of Public Health’s plumbing page, where customers can find the state’s license verification tool.

Homeowners hear warnings about unlicensed plumbers every year. Making your licenses easy to check is a simple way to stand apart.

If your current site hides the license number in small print or skips it, you can see the fix before paying for anything: [get a free redesign](/redesign) of your site with the license block where customers look first.

![Ice floes covering the Chicago River between downtown buildings, with a steel drawbridge in the background](https://images.unsplash.com/photo-1615227776946-a7f8231dda63?auto=format&fit=crop&w=1200&q=75)

## Why do lead service lines deserve their own page?

Because Chicago homeowners are searching for answers, and the program is going to run for years. The city’s Department of Water Management has described over 400,000 lead service lines installed before 1986 and called replacing them a huge, multi-year, multi-billion-dollar effort ([Chicago Department of Water Management, 2025 budget statement](${CHI_DWM})). The city’s water quality report says houses and two-flats built before 1986 have a high likelihood of a lead service line, and points residents to an address lookup at sli.chicagowaterquality.org ([2023 Chicago water quality report](${CHI_CCR_2023})).

State law sets the pace. The Lead Service Line Replacement and Notification Act required water systems to finish a complete inventory by April 15, 2024 and to submit final replacement plans by April 15, 2027. Systems with more than 99,999 lead lines must replace at least 2% a year and finish within 50 years. Owners and occupants must get written notice at least 14 days before planned work, with a required statement in 10 languages, including Spanish ([415 ILCS 5/17.12](${IL_LSL_ACT})). The Department of Public Health counts 667,275 lead lines statewide that need replacing, plus more than 1,000,000 galvanized or unknown-material lines, and notes that water service lines are plumbing under the Plumbing License Law ([IDPH lead service line replacements](${IDPH_LSL})).

The city runs several replacement programs, described in its 2024 water quality report ([2024 Chicago water quality report](${CHI_CCR_2024})):

- **Equity:** free replacement for income-qualified owners of a house or two-flat.
- **Homeowner-Initiated:** the owner pays for the work, and city permit fees up to $5,000 are waived.
- **Leaks and Breaks:** free replacement when a leak or break is found; residents call 311.
- **Daycare:** free replacement at qualifying daycares, which the city contacts directly.
- **Block-Level:** free replacement along water or sewer main work, with the city notifying eligible residents.

If you do this work, a lead service line page is one of the most useful things your site can have. Explain how a homeowner can check their line, which city program might apply and when a privately hired replacement makes sense, what the job involves (permit, excavation or trenchless methods if you use them, restoring the parkway and basement wall), and how long it usually takes you. Link to the city’s program pages rather than paraphrasing eligibility rules, because those details change. And keep it honest: only describe the programs you can actually take part in.

## Basement flooding and sewer backups

Chicago’s sewers mostly carry stormwater and wastewater in the same pipes. The Department of Water Management says the system was designed decades ago when storm patterns were very different, that a heavy storm can put about 500 gallons of water on a home’s roof, and that the city has 4,400 miles of sewer main ([Chicago basement flooding partnership](${CHI_FLOOD})). The Metropolitan Water Reclamation District’s flood resource guide makes the same point about combined sewers across the region, encourages residents to consider contacting a licensed professional for repairs, and offers Overflow Action Alerts by sign-up ([MWRD Flood Resource Guide](${MWRD_GUIDE})).

That gives a plumber two pages worth writing:

1. **Emergency flooding and backups.** What to do right now (stay safe around electricity, don’t use fixtures that drain into the backed-up line), when to call, and how fast you can usually come out after a big storm. Put the phone number at the top and again at the end.
2. **Flood prevention.** The work you actually do to reduce the risk: sewer line inspection with a camera, repairs, sump pumps, backflow prevention or other measures your licensed plumbers install. Describe what the customer gets, what affects the price, and whether permits are involved. If you’re not sure a specific device fits a given home, say that you’ll assess it on site rather than promising it will stop every flood.

## Frozen pipes and Chicago winters

Winter is the other busy season. National Weather Service normals for Chicago (1991 to 2020) put January’s average high at 31.6°F and average low at 18.8°F ([NWS Chicago normals](${NWS_NORMALS})). On January 30, 2019, O’Hare reached minus 23°F, the coldest temperature in Chicago in 34 years, with a wind chill of minus 52°F ([NWS on the January 2019 cold](${NWS_2019})). The city’s all-time record low is minus 27°F, set on January 20, 1985 ([NWS Chicago temperature records](${NWS_RECORDS})).

For the website, that means:

- A **frozen and burst pipe page** that tells people how to find and close the main shutoff, what not to do (no open flames on pipes), and when to call.
- **Hours that are honest.** If you answer at 2 a.m. during a cold snap, say so near the top of every page. If you don’t, say what happens to a message left overnight.
- **Seasonal updates made in time.** A short “before the first deep freeze” note in the fall, linked from the home page, helps customers and shows the site is looked after.

![Plumber in a red shirt tightening a white drain pipe under a bathroom sink, lit by blue light](https://images.unsplash.com/photo-1676210134188-4c05dd172f89?auto=format&fit=crop&w=1200&q=75)

## Should a Chicago plumber’s website be in Spanish?

If someone at your company can take the call and do the walk-through in Spanish, real Spanish pages are worth it. The Census Bureau counts 29.7% of Chicago residents as Hispanic or Latino, and 35.4% of residents age 5 and older speak a language other than English at home (2020 to 2024); in Cook County, the figures are 27.8% and 35.8% ([Census QuickFacts, Chicago](${CENSUS_CHI}), [Cook County](${CENSUS_COOK})). The state’s own lead line notice rule requires a statement in Spanish and nine other languages, which tells you how multilingual the customer base is ([415 ILCS 5/17.12](${IL_LSL_ACT})).

Start with the pages that matter most in an emergency: home, emergency plumbing, lead service lines and contact. Have them written or checked by a fluent speaker, keep the license numbers on them, and link each to its English version so search engines can show the right page to each searcher ([localized versions](${HREFLANG})). Only say “Hablamos español” if a Spanish speaker really answers.

## Owners, renters and two-flats

Chicago’s housing mix shapes who calls you. The Census Bureau puts the owner-occupied housing rate at 46.0% in Chicago and 57.7% in Cook County ([Census QuickFacts](${CENSUS_CHI})). Many calls come from renters, landlords and owners of two-flats and small buildings who live in one unit and rent the other.

Practical choices for the site:

- On the request form, ask whether the person owns or rents, and the property type (house, two-flat, condo, larger building). It routes the job and saves a phone call.
- Write a page for **landlords and property managers:** how you handle tenant-occupied units, access, billing the owner, and repeat work across buildings.
- For renters, explain that the landlord usually arranges and pays for repairs to the building’s plumbing, and invite them to share your number with their landlord.

## How should you cover the city and suburbs?

Cook County had an estimated 5,194,625 residents in July 2025 ([Census QuickFacts, Cook County](${CENSUS_COOK})), and most plumbing companies work across the city and a ring of suburbs. The mistake is a stack of near-identical pages, “Plumber in Evanston,” “Plumber in Oak Park,” “Plumber in Cicero,” with only the town name changed. Google’s spam policies treat that as doorway abuse, and mass-producing pages mainly to rank falls under scaled content abuse ([Google spam policies](${SPAM})).

A better structure:

1. **One service-area page** that lists the neighborhoods and suburbs you serve, with any trip charge for farther areas and a note about whether you hold a Chicago license for work inside the city.
2. **A separate page only where something is genuinely different:** a second shop, a suburb with its own rules you deal with often, or a neighborhood with a housing type you specialize in.
3. **A Google Business Profile set up as a service-area business** if customers don’t visit your shop, with your service areas listed instead of a public address. We explain the setup in [how to show Google where you work](/blog/service-area-business-google).

## Which pages should a Chicago plumbing website have?

Each page should match a different search. For a typical Chicago-area company:

- **Home:** phone number and license numbers near the top, the areas you serve, your main services and your hours.
- **Emergency plumbing:** burst pipes, backups, no water, with what to do first.
- **Lead service line replacement:** see the section above.
- **Flood control and sewer work:** camera inspection, sewer repair, sump pumps and the prevention work you do.
- **Water heaters:** repair and replacement, tank and tankless if you install both.
- **Drain cleaning,** **fixtures and remodels,** and **repiping,** as separate pages if you do them.
- **Landlords and property managers.**
- **About and licenses:** owners, years in business, license numbers and insurance.
- **Reviews:** link to your Google reviews and quote customers only with permission. Our guide on [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) covers what Google allows.
- **Contact and request form:** short, asking how soon, the ZIP code, own or rent.

![Wrench gripping a copper fitting on a pipe above a white water heater tank](https://images.unsplash.com/photo-1620653713380-7a34b773fef8?auto=format&fit=crop&w=1200&q=75)

## Structured data for a plumbing company

Structured data describes your business to search engines in a standard format. Google’s documentation asks you to use the most specific LocalBusiness type you can, and its own example uses Plumber; name and address are the required properties, with phone, hours and others recommended ([Google local business structured data](${LOCAL_SD})). Keep it identical to what the page shows and to your Business Profile. If the markup says you open at 7 and the page says 8, search engines get two answers.

## A checklist before your Chicago plumbing site goes live

1. Illinois license number on the home page near the phone number, and on the contact page.
2. A “Licensed and insured” block with your state license, IDPH contractor registration and City of Chicago contractor license, as they apply.
3. A link to the Department of Public Health’s plumbing page so customers can check a license.
4. Tap-to-call phone number at the top of every page, with honest hours.
5. Emergency, flood control, frozen pipe and lead service line pages written from your real work.
6. Links to the city’s own lead line program pages instead of your paraphrase of eligibility rules.
7. A request form that asks how soon, the ZIP code, own or rent, and property type.
8. Spanish pages only if your team serves Spanish speakers, each linked to its English version.
9. One honest service-area page; town pages only where you have something real to say.
10. Business Profile set up correctly as a storefront or service-area business, matching the site.
11. Plumber structured data that matches the page.
12. The home page passes a mobile [speed test](${PAGESPEED}).

## Where SaySites fits

SaySites builds plumbing websites this way from the start: a page for each service, a service-area page, a tap-to-call number and a job request form on every page. Each site is described to search engines as a Plumber, and every page must pass a 95+ speed check before it can go live. The request form can ask how soon the customer needs you, the ZIP code of the job and whether they own or rent, and every request lands in a leads pipeline where you can call, text, add notes and follow it through to a won job. You make changes by saying them in plain words, like “put our Illinois and Chicago license numbers under the phone number,” and see each change as a draft before it goes live. Nothing is invented: licenses, reviews and photos come from you.

The Site plan is $15 a month, with hosting included and your own domain connected ([websites for plumbers](/websites-for/plumbers), [pricing](/pricing)). Want to see your current site rebuilt before you decide? [Get a free redesign](/redesign). Or [start a 7-day free trial](/signup) and have it ready before the first hard freeze. For more on showing up in local results, read [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).`,
    faq: [
      { q: 'Does my plumbing license number have to be on my website?', a: 'Illinois law says no one who provides plumbing services may advertise them unless the ad includes the license number, and it requires the number on vehicles too. The statute talks about advertisements and doesn’t name websites, but a company website advertises your services, so the safe and simple choice is to show the number on the home page near your phone number.' },
      { q: 'Do I need a City of Chicago license if I have an Illinois plumbing license?', a: 'Yes, for work inside the city. Chicago’s Department of Buildings says a city plumbing contractor license is required to install, alter, repair or maintain plumbing in Chicago, even for contractors licensed by the state. At least one principal must be a city-licensed plumber, and the contractor files a $20,000 performance bond with the city.' },
      { q: 'Should a Chicago plumber’s website have a lead service line page?', a: 'If you do that work, yes. The city has described more than 400,000 lead service lines installed before 1986, and homeowners are searching for how replacement works. Explain how to check a line, which city programs may apply, what the job involves and how long it takes, and link to the city’s program pages for eligibility details.' },
      { q: 'What should a basement flooding page on a plumbing website include?', a: 'Start with safety and what to do right now, then your phone number and how quickly you usually respond after heavy storms. Add a separate prevention page describing the work your licensed plumbers actually do, such as camera inspections, sewer repairs and sump pumps, and avoid promising that any device will stop every flood.' },
      { q: 'Do Chicago plumbers need a Spanish website?', a: 'If someone on your team can serve customers in Spanish, real Spanish pages are worth building. Census figures show 29.7% of Chicago residents are Hispanic or Latino and 35.4% speak a language other than English at home. Start with home, emergency, lead line and contact pages, reviewed by a fluent speaker, with the same license numbers shown.' },
      { q: 'Should I make a page for every suburb I serve?', a: 'Usually not. Google’s spam policies treat near-identical town pages as doorway abuse. One service-area page listing the neighborhoods and suburbs you cover works better, with separate pages only where something is really different, like a second shop. If customers don’t visit you, set up your Business Profile as a service-area business.' },
      { q: 'How much is a plumbing website with SaySites?', a: 'The Site plan is $15 a month, with hosting, your own domain, a job request form, a leads pipeline and SEO included, plus a 7-day free trial. You can also send us your current website for a free redesign preview, so you see the new version with your license block in place before deciding anything.' },
    ],
    about: ['Plumbing contractor websites', 'Illinois Plumbing License Law', 'Chicago, Illinois'],
    published: '2026-10-13',
    status: 'published',
  },
  {
    slug: 'new-york-law-firm-website-rules',
    title: 'New York Law Firm Websites After the 2026 Ad Rule Changes',
    description: 'New York rewrote its lawyer ad rules on June 1, 2026. What a NYC law firm website must still show, what it can drop, and how to build one that gets calls.',
    kind: 'guide',
    summary: [
      'Since June 1, 2026, New York’s Rule 7.1 is short: no false or misleading statements, and every communication names a responsible lawyer or firm with contact information.',
      'The “Attorney Advertising” home page label, the 90-day website archive and the required “Prior results” disclaimer are gone from the rule text.',
      'Calling yourself a certified specialist still requires an approved certifier, named on the page. Rule 7.5 still bans misleading firm, trade and domain names.',
      'In New York City, clients search by borough and often in a language other than English, so the site should be built around how they actually look for help.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1688166871073-9550aeef89e5?auto=format&fit=crop&w=1600&h=1067&q=75', alt: 'Columned neoclassical courthouse facing a paved plaza in New York, with a tall tower behind it under a blue sky' },
    body: `A New York law firm website in 2026 has fewer mandatory parts than it did a year ago. Since June 1, 2026, New York’s advertising rule asks for two things above all: never make a false or misleading statement about your firm, and include the name and contact information of at least one lawyer or firm responsible for the content. The old requirements to label your home page “Attorney Advertising”, to save a copy of your site every 90 days and to attach a fixed disclaimer to past results are no longer in the rule. What hasn’t changed is what wins clients in New York City: pages that speak to the borough, the court and the language your clients actually use.

This guide walks through what the new rules say, what to keep anyway, and how to plan a site for a firm practicing in the five boroughs. It is general information for marketing decisions, not legal advice. For a question about your own content, ask your ethics counsel or the [NYSBA ethics resources](${NYSBA_AMEND}).

## What changed in New York’s attorney advertising rules on June 1, 2026?

The four Departments of the Appellate Division signed a Joint Order on May 27, 2026, that replaced Rules 7.1 and 7.3 of the Rules of Professional Conduct, removed Rule 7.4 and deleted the definitions of “advertisement” and “computer-accessed communication” from Rule 1.0, all effective June 1, 2026 ([Joint Order of the Appellate Division](${NY_ORDER})). The New York State Bar Association describes the new rules as essentially adopting the American Bar Association’s 2018 model advertising rules and comments, while keeping New York’s own Rule 7.5 on firm names ([NYSBA: Amendments adopted to advertising rules](${NYSBA_AMEND})).

For a website, these are the changes that matter most:

- **One standard for everything you say.** The new Rule 7.1(a) bars any false or misleading communication about a lawyer or the lawyer’s services. A statement is misleading if it misstates a material fact or law, or leaves out a fact needed to keep the whole statement from being materially misleading.
- **No home page label.** The old Rule 7.1(f) required most advertisements, including a firm’s website, to carry the words “Attorney Advertising”, on the home page for a site. That paragraph was deleted.
- **No 90-day archive.** The old Rule 7.1(k) required firms to preserve a copy of their website at launch, at each major redesign and at least every 90 days. That paragraph was deleted too.
- **No mandatory results disclaimer.** Results, comparisons and client testimonials used to need the line “Prior results do not guarantee a similar outcome”. The new rule doesn’t require it.
- **A simpler contact rule.** The old rule wanted the name, principal office address and phone number on every ad. New Rule 7.1(d) asks for the name and contact information of at least one responsible lawyer or firm.
- **Specialty claims moved.** The subject of old Rule 7.4 now sits in Rule 7.1(c).

## What does a New York law firm website still have to get right?

Fewer checkboxes doesn’t mean fewer risks. A short rule built around “false or misleading” puts more weight on judgment, and that judgment is applied to every page, every bio and every result you publish.

### Truthful statements, page by page

Rule 7.1(a) covers the whole site: the home page headline, practice area pages, attorney bios, blog posts and even the text of your Google ads that point to it. Watch for statements that are literally true but leave a false impression. A settlement figure shown without saying it was split among many plaintiffs, or a “recovered millions” banner from a firm whose results came mostly from one lawyer who has since left, are the kind of omissions the rule now targets directly.

### A responsible lawyer or firm, with a way to reach them

Under Rule 7.1(d), any communication about your services must name at least one responsible lawyer or firm, with contact information. According to NYSBA’s summary of the amendments, Comment [10] says contact information should always include a telephone number or a physical office address, and may add a website or email ([NYSBA: The amendments to the advertising rules](${NYSBA_PDF})). On a website the simplest way to meet this everywhere is a footer on every page with the firm name, a phone number and an office address.

### Certified specialist claims

Rule 7.1(c) says you may not state or imply that a lawyer is certified as a specialist unless the certifying organization is approved by an appropriate state authority or accredited by the ABA, and the organization is clearly named in the communication ([Joint Order](${NY_ORDER})). NYSBA’s summary adds that the comments now allow a lawyer to say they concentrate in, specialize in or are a specialist in a field based on experience, training or education, so long as the claim isn’t false or misleading ([NYSBA](${NYSBA_PDF})). In practice: “Board certified in civil trial advocacy by [the named organization]” needs the organization on the page. “Focused on landlord-tenant cases since 2011” needs to be true.

### Firm names and domain names

New York kept Rule 7.5. Since its 2020 amendment, a firm in private practice may not use a false, deceptive or misleading trade name or domain name, may not put “non-profit” or “not-for-profit” in a firm name, trade name or domain name unless the firm qualifies, and may not include a nonlawyer’s name in the firm name ([Joint Order amending Rule 7.5](${NY_75})). A domain like a borough name plus “injury help” can be fine; one that suggests a guaranteed outcome, a government office or a legal aid organization invites trouble.

### Solicitation is a separate question

New Rule 7.3 bars soliciting professional employment by live person-to-person contact for pecuniary gain, with exceptions for other lawyers, people with a family, close personal or prior professional relationship, and people who routinely use that type of legal service for business ([Joint Order](${NY_ORDER})). A website that people find on their own is generally not solicitation. Outbound messages to specific people about a specific matter are, so check them against Rule 7.3 before they go out.

## Should you keep the old labels and disclaimers anyway?

Mostly, yes, as a judgment call rather than a rule. Here is how we would think about each one:

1. **“Attorney Advertising” on the home page.** No longer required by New York’s rule. If your firm also advertises to clients in other states, check those states’ own rules before removing it, because each state sets its own requirements.
2. **“Prior results do not guarantee a similar outcome.”** NYSBA’s summary suggests lawyers may still want to use it, to avoid a charge that results are misleading because every case’s facts differ ([NYSBA](${NYSBA_PDF})). A short line next to each result costs nothing and gives readers context they deserve.
3. **Archiving your site.** The 90-day rule is gone, but a dated copy of what your site said is still the best answer if a former client or a grievance committee ever questions a page. A monthly export or a saved copy at every redesign is cheap insurance.
4. **Testimonials from clients with open matters.** The old rule required written informed consent for those. Even without that line in the rule, get permission in writing before quoting any client, and never edit their words into something they didn’t say.

If you’re not sure your current site was updated after June 1, now is a good moment to look. You can [send it to us for a free redesign](/redesign) and compare it page by page against this list.

![Manhattan street lined with cast-iron buildings and fire escapes, seen from a crosswalk with traffic in the distance](https://images.unsplash.com/photo-1750635323790-74b727343a77?auto=format&fit=crop&w=1200&q=75)

## How do New Yorkers search for a lawyer?

A firm in Manhattan and a firm in Queens might practice the same law and still need very different websites, because their clients look for help differently.

### By borough, and by county name

New York City is five counties, and the courts are organized by them. The Civil Court and Housing Court have branches in the Bronx, Kings County (Brooklyn), New York County (Manhattan), Queens and Richmond County (Staten Island) ([NYC Civil Courts by county](${NY_CIVIL})). Clients search with the name they use day to day, like “Brooklyn landlord tenant lawyer”, while court papers say “Kings County”. A good practice area page uses both, naturally: where the case will be heard, by its official name, and the neighborhood words clients recognize.

### With confusion about which court is which

In New York, the Supreme Court is a trial court that sits statewide, and the Court of Appeals is the state’s highest court ([New York court system outline](${NY_COURTS})). Almost every new client from outside the legal world assumes the opposite. A page that explains, in two sentences, which court their divorce, injury case or estate will be in, and what happens there first, answers a real question and is exactly the kind of passage an AI answer can quote.

### In more than one language

Census Bureau figures for New York City show 47.7% of residents age 5 and older speak a language other than English at home, and 36.6% were born outside the United States (2020 to 2024 estimates) ([Census QuickFacts, New York City](${CENSUS_NYC})). If your intake team takes calls in Spanish, Chinese, Russian or Haitian Creole, the site should say so plainly, with real translated pages for your main practice areas, reviewed by a fluent speaker. Google explains how to link language versions of a page so the right one appears for each searcher ([localized versions](${HREFLANG})). Only list a language if someone at the firm can actually serve a client in it.

## Google Business Profile for New York City firms

Your Business Profile often shows before your website does, so it has to match the site and follow Google’s rules. Three of those rules come up constantly in New York:

- **Shared offices and coworking.** Google says a business can’t list an office at a coworking space unless the office has clear signage, receives customers there during business hours and is staffed by your staff during those hours ([Business Profile guidelines](${GBP_GUIDELINES})). Many solo and small firms in Manhattan rent shared space, so check this before creating a profile for it.
- **Individual lawyers.** Google allows profiles for individual practitioners. If several lawyers practice at one office, the firm gets its own profile for that location, and each lawyer’s profile uses only the lawyer’s name ([same guidelines](${GBP_GUIDELINES})). A lawyer shouldn’t have several profiles for different practice areas.
- **Your real name only.** The profile name is your firm’s real name, without extra keywords like “Best Brooklyn Divorce Lawyer”.

Google also lists relevance, distance and prominence as the main factors for local results ([how Google ranks local results](${LOCAL_RANKING})). Distance matters a lot in a city this dense, which is one more reason to describe each real office honestly rather than pretending to be everywhere. We explain the rest of that system in [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).

## Which pages should a NYC law firm website have?

Build around how a worried person moves through the site. For most small and mid-size New York firms that means:

- **A home page** that says in one sentence what you do, where and for whom, with a phone number one tap away.
- **One page per practice area,** each answering the questions you hear on intake calls: what it costs, how long it takes, which court, what to bring.
- **One page per real office,** with its address, the courts nearby and how to get there by subway or car. Not a page for every neighborhood you would like to rank in.
- **Attorney bios** with admissions, education, languages and the kinds of matters each lawyer handles, plus any certification with the certifier named.
- **Results and testimonials,** only ones you can support, with context and client permission.
- **A consultation request** on every page that tells people not to send confidential details yet.

That office rule deserves emphasis. Google’s spam policies list “multiple domain names or pages targeted at specific regions or cities that funnel users to one page” as doorway abuse ([spam policies](${SPAM})). Thirty near-identical pages for thirty neighborhoods is the pattern they describe. One strong page for your Brooklyn office, with real detail about the cases you handle there, is worth more than all of them.

![Man in a gray suit and glasses writing at an office desk while a colleague stands in the background](https://images.unsplash.com/photo-1787532378729-fe4241197405?auto=format&fit=crop&w=1200&q=75)

## Writing for AI answers without changing your ethics

AI Overviews and AI assistants now answer many legal questions before anyone clicks. Google says its AI features draw on the same index as regular search, with no special markup needed ([AI features and your website](${GOOGLE_AI})). For a New York firm that means the same habits that satisfy Rule 7.1 also make pages quotable: plain answers, specific facts, and nothing exaggerated. A sentence like “In New York, divorces are decided in Supreme Court, the state’s main trial court, not in Family Court” is useful to a reader and easy to cite, as long as every such statement is accurate and current. A paragraph of adjectives isn’t. Our guide to [Google AI Overviews for law firms](/blog/google-ai-overviews-for-law-firms) goes deeper.

Two cautions specific to the new rule. First, if your marketing team uses AI tools to draft pages, a lawyer still has to read every claim, because a confident made-up statistic is exactly the material misrepresentation Rule 7.1(a) prohibits. Second, keep structured data (the code that describes your firm to search engines) limited to what the page actually shows. Google’s own guidelines require that, and it matches the rule’s spirit.

![Rows of numbered red and black law reporter volumes behind glass in a wooden bookcase, with a fern in front](https://images.unsplash.com/photo-1769092992534-f2d0210162b9?auto=format&fit=crop&w=1200&q=75)

## A checklist for your New York site after June 1, 2026

Work through this with whoever approves your marketing. It usually takes an afternoon.

1. Every page shows the firm name and at least one responsible lawyer or the firm, with a phone number or office address.
2. Every result, ranking, award and comparison can be supported today, with context about what made the case different.
3. Testimonials are real, unpaid or disclosed as paid, and approved in writing by the client.
4. Any “certified specialist” wording names the certifying organization. Other specialty wording is accurate.
5. The firm name, trade name and domain name aren’t misleading and don’t suggest a nonprofit or government office.
6. You’ve decided, deliberately, whether to keep the “Attorney Advertising” label and the results disclaimer, and checked the rules of any other state you advertise in.
7. Practice area pages name the right court and county and explain the first steps plainly.
8. Translated pages exist only for languages your team actually serves, and each links to its English version.
9. Each office page matches its Google Business Profile exactly, and shared space meets Google’s staffing rules.
10. No near-duplicate neighborhood pages.
11. A dated copy of the site is saved before and after every major change.

## Where SaySites fits

SaySites builds law firm sites around this structure: a page for each practice area, attorney profiles, a consultation request on every page, and intake questions that include the other party’s name for a conflict check. Each firm is described to search engines as a LegalService, each attorney and practice area gets its own structured data, and every page has to pass a 95+ speed check before it can go live. Nothing is invented. Results, reviews and credentials appear only if you give them to us, and you can change any of it by describing the change in plain words.

The Law Firm Starter plan is $79 a month ([law firm websites](/websites-for/law-firms), [all plans and pricing](/pricing)). If your site still has pre-June wording or simply looks dated, [get a free redesign](/redesign) of your current site and see it rebuilt for 2026. Or [start a 7-day free trial](/signup) and build your own. If your firm also practices in Florida, read our guide to [Florida law firm websites and the Bar’s rules](/blog/law-firm-website-design-florida), and for a look at what top-ranking firm sites get wrong, see [what we found testing 105 of them](/blog/we-tested-top-ranking-law-firm-websites).`,
    faq: [
      { q: 'Does a New York law firm website still need the “Attorney Advertising” label?', a: 'Not under New York’s rule. The old Rule 7.1(f), which required the label on a website’s home page, was deleted when the amendments took effect on June 1, 2026. Some firms keep it anyway, and firms that advertise to clients in other states should check those states’ rules first, since each state sets its own requirements.' },
      { q: 'Do I still have to archive my website every 90 days in New York?', a: 'No. The old Rule 7.1(k) required a saved copy at launch, after major redesigns and at least every 90 days, and that paragraph was removed effective June 1, 2026. Keeping a dated copy whenever the site changes is still sensible, because it shows exactly what you published if a page is ever questioned.' },
      { q: 'Can I post case results on my New York law firm website?', a: 'Yes, as long as they aren’t false or misleading under the new Rule 7.1(a). A result can mislead if it leaves out important context, such as a recovery shared by many clients or a case with unusual facts. NYSBA’s summary suggests considering the line “Prior results do not guarantee a similar outcome” even though the rule no longer requires it.' },
      { q: 'Can a New York lawyer call themselves a specialist online?', a: 'Claiming to be certified as a specialist requires certification by an organization approved by a state authority or accredited by the ABA, and the organization must be named. NYSBA’s summary of the comments says uncertified lawyers may describe a specialty or concentration based on experience, training or education, as long as the claim is accurate.' },
      { q: 'What contact details must a New York law firm website show?', a: 'New Rule 7.1(d) requires the name and contact information of at least one lawyer or firm responsible for the content. According to NYSBA’s summary, the comments say this should always include a phone number or a physical office address. A footer on every page with the firm name, phone and address covers it.' },
      { q: 'Should a NYC law firm have a page for every borough?', a: 'Only for boroughs where you have a real office or a real, distinct practice. Google’s spam policies treat many near-identical city or area pages that funnel visitors to one place as doorway abuse. One detailed page per real office, naming the local courts and how clients reach you, serves people better than thin copies.' },
      { q: 'Can my New York firm list a coworking office on Google?', a: 'Google allows it only if the office has clear signage, receives clients there during business hours and is staffed by your own staff during those hours. If you only use the space occasionally or for mail, it doesn’t qualify. Your website and your Business Profile should show the same real office details.' },
    ],
    about: ['New York Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'New York City'],
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'phoenix-hvac-website-design',
    title: 'Phoenix HVAC Website Design: ROC Rules to Heat-Season Calls',
    description: 'What an HVAC company website in Phoenix must show under Arizona ROC rules, and how to build one that answers no-cool calls, renters and Spanish speakers.',
    kind: 'guide',
    summary: [
      'Arizona law puts your ROC license number on your advertising; online ads can skip it only if they link to a home page that shows your name and license number prominently, and not just in the footer.',
      'Phoenix averages 111 days a year at 100°F or hotter (1991 to 2020), so the site has to work for someone on a phone with a dead AC, day or night, well into October.',
      'Renters are a real audience: Phoenix requires rental air conditioning to cool to 82°F, or 86°F with an evaporative cooler.',
      'Real Spanish pages, honest service-area pages and HVACBusiness structured data round out a site built for the Valley.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1729041534038-fdc1f9cf3d3a?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown Phoenix high-rises glowing at sunset, with a long avenue and distant desert mountains' },
    body: `An HVAC company website in Phoenix has one legal must and one practical must. The legal one: Arizona requires your ROC license number on your advertising, and your online ads can leave it out only if they link to a website whose home page shows your business name and license number prominently, not tucked into the footer. The practical one: when it is 112°F and the air conditioner stops, a homeowner or renter picks up a phone and calls whoever makes it easiest. Everything else on the site, from service pages to Spanish translations, should serve that call.

This guide covers both, with the Arizona rules and the local facts linked to their sources, and a checklist at the end. It is general information, not legal advice; for a question about your own license or ads, the Registrar of Contractors is the authority.

## What does Arizona law require on an HVAC contractor’s website?

Arizona Revised Statutes section 32-1124 says the license number must be preceded by the letters “ROC” and must appear in specific places: at any job site, on all written bids and estimates, on published advertising, letterheads and documents you use with customers, and on broadcast, internet or billboard advertising ([A.R.S. § 32-1124](${ARS_1124})).

That last item has an exception that matters for your website. Broadcast, internet and billboard ads can leave the number off if they include a web address that links directly to a site that prominently displays your name and license number. The Registrar explained the change when it took effect on September 29, 2021, and spelled out what “prominently displayed” means ([Arizona ROC on the advertising change](${ROC_ADS})):

- the web address in the ad links directly to your home page;
- your name and ROC license number appear directly on the home page;
- they are clearly visible, not hidden behind graphics, photos or other obstructions;
- they are in an appropriately sized font; and
- they are **not in the website’s footer.**

That last point catches a lot of contractor sites, where the license number lives in small print at the bottom of the page. If your truck wraps, radio spots, search ads or billboards show your web address without the number, the home page has to carry it near the top, in readable type. A short line under your phone number, like “ROC 123456, licensed, bonded and insured”, does the job (with your real number, and only the claims that are true).

The Registrar’s notice adds two reminders. Bids, contracts, estimates and documents sent to customers still need the license number, whatever your ads do. And an unlicensed business must include the exact phrase “Not a Licensed Contractor” in all of its advertising ([Arizona ROC](${ROC_ADS})).

## Which license classifications should the site name?

Customers can’t tell an R-39 from a C-39, but naming yours accurately helps them, and it keeps you honest about the work you take on. Arizona’s rules define the residential air conditioning classification, R-39, as allowing installation and repair of comfort air conditioning, including refrigeration, evaporative cooling, ventilation and heating ([A.A.C. R4-9-103](${AZ_RES})). The commercial C-39 classification covers refrigeration and evaporative cooling systems, heating systems and ventilation, including duct work and controls ([A.A.C. R4-9-102](${AZ_COM})). Dual licenses that cover both are described in a separate rule ([A.A.C. R4-9-104](${AZ_DUAL})).

On the site, a simple “Licenses” line on the about page works: each license number, its classification in plain words (“residential heating and air”) and a link to the Registrar’s site, where anyone can look a contractor up ([roc.az.gov](${ROC_HOME})). The Registrar itself tells homeowners to check a license before hiring, so making that check easy is a small trust signal that costs nothing.

![Outdoor air conditioner condenser unit on the ground beside a teal metal shutter, with palm-leaf shadows in sunlight](https://images.unsplash.com/photo-1724488751821-1415f5cf4960?auto=format&fit=crop&w=1200&q=75)

## Why HVAC searches in Phoenix are different

Most HVAC websites are written for a market with two busy seasons. Phoenix has one very long one. National Weather Service records for Phoenix show ([NWS Phoenix extreme temperatures](${NWS_PHX})):

- an average of 111 days a year at 100°F or hotter over 1991 to 2020;
- a record 70 days at 110°F or hotter in 2024;
- the longest run of 100°F days on record, 113 days from May 27 to September 16, 2024;
- and the latest 110°F day on record, October 7, 2024.

For a website, that translates into a few concrete choices:

1. **The phone number is the main feature.** Put it at the top of every page as a tap-to-call link, and repeat it after each section of a service page. Someone sweating in a 95°F living room won’t hunt for it.
2. **Say when you answer.** If you take after-hours or weekend calls, say so near the top, with the hours. If you don’t, say that too, and tell people what happens to a message left overnight.
3. **Answer the first questions on the page.** Is there a service call fee? How soon can someone come out? What can they check before calling, like the thermostat setting, the breaker or a clogged filter? Clear answers reduce wasted trips and build trust.
4. **Load fast on a phone.** A page that takes ten seconds over a weak signal loses the caller to the next result. Google’s Core Web Vitals give you a way to measure this, and [PageSpeed Insights](${PAGESPEED}) will test any page.
5. **Keep the season going into fall.** Since 110°F days have reached into October, pages promoting tune-ups or replacements shouldn’t switch to heating talk on September 1.

## Renters and landlords: a real Phoenix audience

A large share of Phoenix calls come from people who don’t own the system. Census Bureau figures put the owner-occupied rate in Phoenix at 57.3% for 2020 to 2024, which leaves a lot of renters in the city ([Census QuickFacts, Phoenix](${CENSUS_PHX})). And Phoenix has a rule that shapes those calls.

The City of Phoenix cooling ordinance, in City Code Chapter 39-5, requires every rental unit with cooling installed to be able to cool habitable rooms and bathrooms to no more than 82°F with air conditioning, or 86°F with evaporative cooling, measured three feet above the floor in the center of the room ([City of Phoenix cooling ordinance flyer](${PHX_COOLING})). The city publishes the flyer in English and Spanish and runs a landlord and tenant program for questions.

That gives an HVAC company two useful pages to write:

- **For property managers and landlords:** how you handle rental calls, who you bill, how you coordinate access with tenants, and maintenance plans for multiple units.
- **For renters:** what to tell the landlord, that the landlord usually arranges the repair, and a link to the city’s own explanation rather than your interpretation of it. You’re not giving legal advice, just pointing people to the source.

On your request form, ask whether the person owns or rents the property. It saves a phone call and routes the job to the right person from the start.

## Do you need Spanish pages for a Phoenix HVAC site?

For most Phoenix contractors, yes, if someone on your team can take the call. The Census Bureau counts 42.0% of Phoenix residents as Hispanic or Latino, and 35.9% of residents age 5 and older speak a language other than English at home (2020 to 2024 estimates) ([Census QuickFacts, Phoenix](${CENSUS_PHX})). In Maricopa County as a whole, 26.0% speak a language other than English at home.

A good Spanish section is not a translation widget. It’s a few real pages, starting with the home page, AC repair and contact, written or reviewed by a fluent speaker, with the same ROC license line and the same honest claims as the English pages. Link each Spanish page to its English version so Google can show the right one to each searcher ([localized versions](${HREFLANG})). And only say “Hablamos español” if a Spanish speaker actually answers the phone or calls back.

![Aerial view of a sprawling Phoenix suburban neighborhood of tile-roofed homes and trees, mountains on the horizon](https://images.unsplash.com/photo-1785183086929-61e343715643?auto=format&fit=crop&w=1200&q=75)

## How do you cover the whole Valley without doorway pages?

Maricopa County had an estimated 4,689,558 residents in July 2025, spread across Phoenix and many neighboring cities ([Census QuickFacts](${CENSUS_PHX})). It’s tempting to make a page for every one of them, with the city name swapped in. Google’s spam policies describe exactly that as doorway abuse: “multiple domain names or pages targeted at specific regions or cities that funnel users to one page” ([spam policies](${SPAM})).

A better structure:

- **One service-area page** that lists the cities and neighborhoods you really cover, with a map or plain description of the boundaries and any trip charge for distant areas.
- **A separate city page only when there’s something real to say:** a second shop, a crew based there, or genuinely different conditions you can describe.
- **A Google Business Profile set up as a service-area business** if customers don’t come to your shop. Google lets you hide your address and list the areas you serve instead ([service areas on Google](${SERVICE_AREAS})). We cover that setup step by step in [how to show Google where you work](/blog/service-area-business-google).

## Which pages should a Phoenix HVAC website have?

Each page should match a different kind of search. For a typical Valley contractor:

- **Home:** what you do, the areas you serve, the phone number and the ROC license line at the top.
- **AC repair:** the emergency page. Hours, how fast you usually respond, the fee for a service call if you publish one, and what to check first.
- **AC replacement and installation:** how you size a system, the brands or equipment types you install, financing if you offer it, and how long an install takes.
- **Heat pumps:** many Valley homes heat and cool with one, so it deserves its own page.
- **Evaporative coolers:** if you service them, say so. Both Arizona classifications above include evaporative cooling, and plenty of homeowners still search for it.
- **Maintenance plans:** what a spring tune-up includes before the heat, what a fall visit includes, and how to sign up.
- **Rental and property management:** see the section above.
- **About and licenses:** owners, years in business, license numbers, the crew if they agree to appear.
- **Reviews:** link to your Google reviews, and quote real customers only with their permission. Our guide on [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) explains what Google allows.
- **Contact and request form:** short, with how soon they need you, the ZIP code and whether they own or rent.

Utility rebates and manufacturer promotions can go on the replacement page, but only with current details and a link to the program’s own page. An expired rebate on your site is worse than none.

![White digital thermostat with a gray display screen mounted on a beige interior wall](https://images.unsplash.com/photo-1619140099965-06d74aaf51fa?auto=format&fit=crop&w=1200&q=75)

## Structured data for an HVAC company

Structured data is code that describes your business to search engines in a standard format. Schema.org has a specific type for heating and air contractors, HVACBusiness ([schema.org/HVACBusiness](${SCHEMA_HVAC})), and Google’s local business documentation lists the properties it reads, like name, address, phone, hours and areas served ([local business structured data](${LOCAL_SD})). Keep it identical to what the page shows and to your Business Profile. If the markup says you open at 7 and the page says 8, you’ve given search engines two answers.

## A checklist before your Phoenix HVAC site goes live

1. Business name and “ROC” license number on the home page, near the top, readable, not only in the footer.
2. License numbers and classifications listed on the about page, with a link to the Registrar’s lookup.
3. Tap-to-call phone number at the top of every page, with the hours you answer.
4. AC repair page that answers fees, response time and quick checks in plain words.
5. Separate pages for repair, replacement, heat pumps, evaporative coolers and maintenance plans, as they apply to you.
6. A page for landlords and property managers, and a request form that asks own or rent.
7. Spanish pages only if your team serves Spanish speakers, each linked to its English version.
8. One honest service-area page; city pages only where you have something real to say.
9. Business Profile set up correctly as a storefront or service-area business, matching the site exactly.
10. HVACBusiness structured data that matches the page.
11. Every rebate, financing offer and review on the site is current and real.
12. The home page passes a mobile speed test.

## Where SaySites fits

SaySites builds HVAC websites with this structure from the start: a page for each service, a service-area page, a tap-to-call number and a request form on every page. Each site is described to search engines as an HVACBusiness, and every page must pass a 95+ speed check before it goes live. The job request form can ask how soon the customer needs you, the ZIP code of the job and whether they own or rent, and every request lands in a leads pipeline where you can call, text, take notes and track it to a booked job. You make changes by saying them in plain words, like “put our ROC number under the phone number on the home page”, and see each one as a draft before it goes live.

The Site plan is $15 a month, with hosting included and your own domain connected ([websites for HVAC companies](/websites-for/hvac-companies), [pricing](/pricing)). Want to see your current site rebuilt first? [Get a free redesign](/redesign). Or [start a 7-day free trial](/signup) and build it yourself before the next heat wave. For more on getting found locally, read [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).`,
    faq: [
      { q: 'Does my ROC license number have to be on my HVAC website?', a: 'If your internet, radio, TV, vehicle or billboard ads show your web address instead of your license number, yes. Arizona lets those ads skip the number only when they link directly to a home page that prominently shows your business name and ROC number. Showing it on the home page is the simplest way to stay covered.' },
      { q: 'Can the ROC license number go in my website footer?', a: 'Not if you rely on the website exception for your ads. The Registrar of Contractors says the name and license number must appear directly on the home page, be clearly visible, use an appropriately sized font and not be placed in the footer. A line near your phone number at the top of the page works well.' },
      { q: 'What should a Phoenix AC repair page include?', a: 'Your phone number at the top, the hours you answer, how quickly you usually respond, any service call fee you’re comfortable publishing, and a few checks people can try first, such as the thermostat, breaker and filter. Add the areas you cover and your ROC license number, and keep the page fast on a phone.' },
      { q: 'Do Phoenix landlords have to fix broken air conditioning?', a: 'The City of Phoenix cooling ordinance requires rental units with cooling installed to cool rooms to no more than 82°F with air conditioning or 86°F with evaporative cooling. An HVAC website can link to the city’s explanation and its landlord and tenant program, but shouldn’t give tenants legal advice of its own.' },
      { q: 'Should my Phoenix HVAC company have a Spanish website?', a: 'If someone on your team can serve customers in Spanish, real Spanish pages are worth it. Census figures show 42.0% of Phoenix residents are Hispanic or Latino and 35.9% speak a language other than English at home. Start with the home, AC repair and contact pages, reviewed by a fluent speaker.' },
      { q: 'Should I make a separate page for every Valley city I serve?', a: 'Usually not. Google treats many near-identical city pages that funnel visitors to one place as doorway abuse. One service-area page listing the cities you cover is better, with separate city pages only where you have a real local office, crew or something genuinely different to explain.' },
      { q: 'How much does an HVAC website cost with SaySites?', a: 'The Site plan is $15 a month, with hosting, your domain, a leads pipeline and SEO included, and a 7-day free trial to start. You can also send us your current website for a free redesign preview, so you can see the new version before you decide anything.' },
    ],
    about: ['HVAC contractor websites', 'Arizona Registrar of Contractors', 'Phoenix, Arizona'],
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'law-firm-website-design-florida',
    title: 'Law Firm Website Design in Florida: Bar Rules and SEO',
    description: 'What a Florida law firm website must say, what the Bar’s advertising rules forbid, and how to build a Miami or statewide firm site that ranks and gets calls.',
    kind: 'guide',
    hero: { src: 'https://images.unsplash.com/photo-1602792384159-e0f1e8ed0062?auto=format&fit=crop&w=1600&q=75', alt: 'Downtown Miami towers seen across the water from Brickell Key on a clear day' },
    summary: [
      'Florida law firm websites don’t have to be filed with the Bar, but every advertising rule in Subchapter 4-7 still applies to them.',
      'Each site must name a responsible lawyer or firm and the city, town or county of at least one real office.',
      'Past results, testimonials, “expert” claims and comparisons are where most Florida firm sites get into trouble.',
      'In Miami-Dade, most residents speak a language other than English at home, so a real Spanish version can matter as much as any ranking tactic.',
      'A site that ranks in Florida is one page per practice area, clear local details, fast on phones and honest about what the firm has done.',
    ],
    body: `A Florida law firm website has two jobs at once. It has to persuade a stressed person on a phone to call you instead of the next firm, and it has to do that inside some of the most detailed lawyer advertising rules in the country. Get the first part wrong and the phone doesn’t ring. Get the second part wrong and the phone call you get is from The Florida Bar.

The short answer: your website is exempt from the Bar’s filing requirement, but it is not exempt from the rules. Build it around plain facts you can prove, one page for each kind of case you handle, accurate local details and a fast, simple way to get in touch. That combination is also what Google rewards.

This guide walks through both halves for firms in Miami, Fort Lauderdale, West Palm Beach, Tampa, Orlando, Jacksonville and everywhere else in the state. It’s practical guidance, not legal advice. When a specific line on your site is a close call, the Bar’s Ethics and Advertising Department is the place to ask.

## Does a Florida law firm website have to be filed with the Bar?

No. The Bar’s own filing page says lawyer and law firm websites are exempt from filing under Rule 4-7.20(g), and that includes pop-ups on your own site ([Florida Bar advertising filing requirements](${FB_FILING})). Television, radio, print and internet ads generally do have to be filed at least 20 days before first use unless they contain only the “safe harbor” information in Rule 4-7.16, and the Bar lists a fee for each filing.

The same page makes the important point in plain terms: being exempt from filing does not exempt you from the rest of Subchapter 4-7. Your website is still lawyer advertising. The full text of the rules lives in Chapter 4 of the Rules Regulating The Florida Bar ([Rules Regulating The Florida Bar](${FB_RULES})).

That distinction matters for how firms market themselves. A paid search ad or social ad that sends people to your site may need its own filing even though the site it lands on does not. If your marketing person runs ads, make sure someone owns that question.

## What every Florida firm website has to include

The Bar’s filing page summarizes two requirements that apply to every advertisement, websites included: you must name at least one lawyer, firm or qualifying provider responsible for the content, and you must give the city, town or county of at least one bona fide office where the advertised services are actually performed ([Florida Bar advertising filing requirements](${FB_FILING})).

In practice, put both somewhere people and search engines will find them on every page, usually the footer:

- **The firm’s name and the responsible lawyer.** “Smith & Garcia, P.A.” plus a named attorney.
- **A real office location.** A street address if clients visit, or at minimum the city or county of a real office. A virtual mailbox in a city where no one works is the kind of thing this rule is aimed at.
- **The same details everywhere.** Your Google Business Profile, your site and your directory listings should match exactly. Google’s guidelines for Business Profiles also ask for a real address and accurate information ([Guidelines for representing your business on Google](${GBP_GUIDELINES})).

## The Florida rules that trip up law firm websites most

Rule 4-7.13 lists what Florida treats as deceptive or inherently misleading. Most website problems come from a handful of its categories. Here they are in plain English, with how to handle each one.

### Past results and verdicts

Florida allows past results only when they are objectively verifiable. The rule’s comment adds that results can be misleading if they’re not typical of similar cases, if they leave out that a judgment was uncontested or by default, or if they leave out that the amount was far below the client’s actual damages. Advertising a client’s result also requires that client’s informed consent, even if the case is public record ([Rules Regulating The Florida Bar](${FB_RULES})).

What that means for your site:

1. Only list results you can document with the file.
2. Get written consent from each client before their result goes up.
3. Add the context the rule asks for: was it a default, a settlement, a verdict?
4. Don’t let a “Results” page of your three biggest numbers imply that’s what every case is worth.

A results page built this way is also more persuasive. Specific, documented outcomes read as honest; a wall of large round numbers reads as advertising.

### Testimonials and reviews

Florida permits testimonials with conditions. Under the rule, a testimonial is a problem if the person isn’t qualified to judge what they’re praising, if it isn’t their actual experience, if it doesn’t reflect what the firm’s clients generally experience, if the lawyer wrote it, if it was given in exchange for something of value, or if it lacks a disclaimer that the reader may not get the same or similar results ([Rules Regulating The Florida Bar](${FB_RULES})). The comment notes that honest testimonials about things like courtesy, promptness and demeanor are fine when they come from real experience.

So: real clients, their own words, nothing paid, and a clear results disclaimer next to them. Never write or edit a review “for” a client. On Google, the same instinct keeps you on the right side of the platform’s review policies as well.

### “Expert,” “specialist” and comparisons

Rule 4-7.13 treats comparisons and characterizations of skill, experience or reputation as misleading when they can’t be objectively verified. “The best car accident lawyer in Miami” is the classic example. Statements about character, such as being honest or responsive, are allowed.

Specialization has its own path in Florida. The Bar runs a board certification program with 27 certification areas, and certified lawyers may use “Board Certified Specialist” or the letters B.C.S. with their area ([Florida Bar board certification](${FB_CERT})). If a lawyer at your firm is certified, say so on their profile and the relevant practice page, with the area named. If no one is, describe what you do and how long you’ve done it instead of reaching for “expert.”

### Guarantees, Bar approval and titles

Three smaller rules catch firms regularly:

- **No promises.** Predictions or guarantees of a result, the kind a reader could take as a promise, are prohibited. “We’ll get you the money you deserve” is close to the line. “We’ll review your case and tell you honestly what we think” is not.
- **No implied Bar endorsement.** You can say you’re licensed in Florida. You can’t suggest the Bar approved your ad or vouches for you.
- **Titles.** A former judge can mention that service after their name with a word like “former” or “retired,” not as a title in front of it.

### Search ads and look-alike contact details

One part of Rule 4-7.13 speaks directly to online marketing. It bars implying an affiliation with another lawyer or firm that doesn’t exist, including through ads triggered by a search for someone else or contact details that could steer a searcher to the wrong firm. If anyone bids on a competitor’s name for you, have that conversation now.

![An empty conference room with a long table and chairs, ready for a first consultation](https://images.unsplash.com/photo-1755551636128-2385f552d7ec?auto=format&fit=crop&w=1200&q=75)

## How Florida clients actually look for a lawyer

Rules are half the picture. The other half is how people in Florida search, and that varies more by region than most national advice admits.

### A real Spanish version, not a translate button

In Miami-Dade County, the Census Bureau reports that roughly three in four residents age 5 and over speak a language other than English at home, based on its 2020 to 2024 survey data ([U.S. Census Bureau QuickFacts, Miami-Dade County](${CENSUS_MIAMI})). For an immigration, family, personal injury or criminal defense practice in South Florida, a Spanish-speaking client who finds only English pages is a client who keeps scrolling.

If you serve Spanish-speaking clients, give them real pages: separate, properly written Spanish versions of your key practice pages, linked to their English counterparts. Google’s documentation explains how to tell it about language versions of a page so the right one shows to the right searcher ([Tell Google about localized versions of your page](${HREFLANG})). Two cautions. Only say “se habla español” if someone who answers the phone actually does. And remember the Bar’s rules apply to your Spanish pages exactly as they apply to your English ones.

### Searches are local and specific

People rarely search “lawyer.” They search “slip and fall attorney Hialeah,” “DUI lawyer Fort Lauderdale” or “divorce lawyer near me.” Google says local results come down mainly to relevance, distance and prominence ([How Google ranks local results](${LOCAL_RANKING})). Distance you can’t change. Relevance and prominence are where your website does its work:

- **One page per practice area.** A single “Practice Areas” page that lists twelve kinds of law gives Google nothing specific to rank. A full page on Florida car accident claims, with what to do after a crash and how your firm handles them, does.
- **Honest location pages.** If you have offices in Miami and Boca Raton, give each its own page with its real address, hours and directions. Don’t create pages for cities where you have no office and say nothing specific about them; Google’s spam policies call that out as doorway pages ([Google Search spam policies](${SPAM})).
- **A complete, accurate Business Profile.** Same name, address and phone as your site, the right primary category and real hours.

### Most of them are on a phone, in a hurry

Someone looking for a lawyer is often having one of the worst days of their year. They’re on a phone, maybe at a hospital or outside a courthouse. A page that takes several seconds to show anything, or hides the phone number below a slider, loses them. Google’s Core Web Vitals are a reasonable way to measure this: how fast the main content shows, how quickly the page responds and whether things jump around while it loads ([Web Vitals](${WEB_VITALS})).

## What a high-converting Florida law firm website looks like

Put the rules and the search behavior together and the shape of a good Florida firm site is fairly clear.

### The home page answers three questions in five seconds

What kind of cases do you handle, where, and how do I reach you? A headline like “Personal injury and wrongful death lawyers in Miami-Dade and Broward” beats a slogan every time. Put a tap-to-call button and a short consultation form above the fold on mobile.

### Practice area pages that actually explain things

Each page should answer the questions a client asks in a first call: Do I have a case? What happens next? How do fees work? How long does it take in Florida? Write from your real experience, link to official sources where a law or deadline matters, and keep claims inside Rule 4-7.13. Google’s guidance on helpful content asks the same questions a careful client would: is this written by someone with real expertise, and does it leave the reader better informed ([Creating helpful, reliable, people-first content](${HELPFUL})).

### Attorney profiles that build trust honestly

Photo, bar admission, education, board certification if any, the kind of cases they handle and something human. These pages are where character statements (“returns every call the same day”) belong, because those are allowed and they’re what clients care about.

### A consultation form that respects the client

Keep it short: name, phone, email, a few words about what happened. Make it clear that sending the form doesn’t create an attorney-client relationship and that they shouldn’t include confidential details yet. If you do conflict checks, ask for the other party’s name.

### Markup that tells Google what you are

Structured data describes your firm in a format search engines read: a LegalService with your name, address, phone, hours and areas served. Google’s local business documentation explains the properties it uses ([Local business structured data](${LOCAL_SD})). The rule is simple: mark up only what the page actually shows.

### Accessibility

A site people can’t use with a screen reader or keyboard loses clients and creates risk. The Department of Justice has published guidance on web accessibility under the ADA that is worth a read before you launch ([Guidance on web accessibility and the ADA](${ADA_WEB})).

![A person typing on a laptop at a desk, drafting a page for a firm website](https://images.unsplash.com/photo-1749648329134-75ed14f7dae5?auto=format&fit=crop&w=1200&q=75)

## A pre-launch checklist for Florida firms

Before a new or redesigned site goes live, walk through this list. It takes an hour and saves a lot of trouble.

1. Every page shows the firm name, a responsible lawyer and the city or county of a real office.
2. Every result on the site is documented, typical context is explained, and each client gave informed consent.
3. Every testimonial is a real client’s own words, unpaid, with a disclaimer that results vary.
4. No “best,” “top,” “#1” or “expert” claims that can’t be objectively verified. Board certification is named correctly where it exists.
5. No guarantees or promises of results, and nothing suggesting Bar approval.
6. Spanish pages, if you have them, are real translations reviewed by a fluent speaker and follow the same rules.
7. One page per practice area and per real office. No pages for cities you don’t serve from a real office.
8. Name, address and phone match your Google Business Profile exactly.
9. The site loads fast on a phone and the phone number is one tap away on every page.
10. Structured data matches what’s on the page, and the site works with a keyboard and screen reader.
11. Someone at the firm is responsible for checking whether ads pointing to the site need to be filed.

## What changes if you’re outside Miami?

The rules are statewide, so everything above applies from Pensacola to Key West. What changes is who calls you, and your site should be written for them. Look at your last fifty intake calls and ask a few questions:

- **Where do your clients live?** If many are visitors hurt while on vacation in Orlando or Tampa, your pages should explain what happens when you go home to another state before the case is over.
- **Who is making the call?** In estate planning and probate, the person searching is often an adult child, sometimes out of state. Explain the Florida process for someone who has never been through it.
- **Which language do they use?** If a third of your calls are in Spanish or Haitian Creole, your site should be too.
- **What do they ask first?** Fees, timing and whether they have a case come up in almost every first call. Answer them on the page.

The firms that do well online are usually the ones whose website sounds like their best intake call.

## Where SaySites fits

SaySites builds law firm sites around exactly this structure: a separate page for each practice area, attorney profiles, a consultation request on every page, intake questions with a conflict check and room for the attorney advertising notices your state requires. Each firm is described to Google as a LegalService, every page has to pass a speed check before it goes live, and nothing is ever invented: no results, reviews or credentials you didn’t give us. The Law Firm Starter plan is $79 a month ([see law firm plans](/websites-for/law-firms) and [pricing](/pricing)).

You stay responsible for what your site says, and that’s how it should be. What changes is that updating a bio, adding a result your client approved or fixing a disclaimer takes a sentence instead of a support ticket.

If your current site is slow, thin or out of step with the rules above, [send it to us for a free redesign](/redesign) and see what it could look like. Or [start a 7-day free trial](/signup) and build your own. For more on how search engines and AI answers pick which firms to show, read [Google AI Overviews: what law firms should know](/blog/google-ai-overviews-for-law-firms) and [what we found testing 105 top-ranking law firm websites](/blog/we-tested-top-ranking-law-firm-websites).`,
    faq: [
      { q: 'Do I have to file my law firm website with The Florida Bar?', a: 'No. Lawyer and law firm websites are exempt from the Bar’s filing requirement under Rule 4-7.20(g), including pop-ups on your own site. The exemption covers filing only. Everything else in Subchapter 4-7 still applies, so the content on your site has to follow the same advertising rules as any other lawyer advertisement in Florida.' },
      { q: 'Can I put case results on my Florida law firm website?', a: 'Yes, if they are objectively verifiable and you have the client’s informed consent, even when the case is public record. The rules also treat results as misleading if they are atypical, leave out that a judgment was a default or uncontested, or omit that it was far below actual damages. Document each result and add that context.' },
      { q: 'Are client testimonials allowed on Florida lawyer websites?', a: 'They are allowed with conditions. A testimonial must be the client’s real experience in their own words, about something they can judge, not paid for, not written by the lawyer, typical of what clients experience, and paired with a disclaimer that results may differ. Testimonials about courtesy, promptness and demeanor are specifically recognized as acceptable.' },
      { q: 'Can a Florida lawyer call themselves an expert or specialist online?', a: 'Unverifiable claims about skill or reputation are treated as misleading. Florida offers board certification in 27 areas, and certified lawyers may use “Board Certified Specialist” or B.C.S. with their area named. If no one at the firm is certified, describe your experience and the cases you handle in factual terms instead.' },
      { q: 'Does my Florida law firm need a Spanish website?', a: 'It depends on who you serve, but in Miami-Dade most residents speak a language other than English at home, according to Census Bureau data. If Spanish-speaking clients call you, real Spanish pages linked to their English versions help them and help Google show the right page. Only advertise Spanish service if someone at the firm can provide it.' },
      { q: 'What should be in the footer of a Florida law firm website?', a: 'At minimum, the firm’s name, a responsible lawyer and the city, town or county of at least one real office where the services are performed. Most firms also add the full address, phone number, hours, links to attorney profiles and any disclaimers, such as a note that contacting the firm through the site doesn’t create an attorney-client relationship.' },
      { q: 'How much does a Florida law firm website cost?', a: 'Costs range widely, from a monthly subscription to custom builds with ongoing agency fees and long contracts. SaySites’ Law Firm Starter plan is $79 a month and includes practice area pages, attorney profiles, consultation requests and intake questions. Whatever you choose, budget time for keeping results, bios and disclaimers accurate.' },
    ],
    published: '2026-10-10',
    status: 'published',
  },
  {
    slug: 'houston-dental-practice-website-texas-rules',
    title: 'Houston Dental Websites: What Texas Rules Require',
    description: 'A plain-English guide to the Texas dental board’s advertising rules for websites, and how a Houston practice can build a site that patients trust and Google ranks.',
    kind: 'guide',
    hero: { src: 'https://images.unsplash.com/photo-1686840007773-67280673ca0b?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown Houston’s office towers and freeways on a sunny day' },
    summary: [
      'Texas has its own dental advertising rules, and Section 108.59 sets out what a practice website has to disclose.',
      'General dentists who list specialty services such as implants or orthodontics must label themselves “General Dentist” right after their name.',
      'Testimonials, before and after photos, “painless” claims and “free” offers each have specific Texas rules.',
      'Close to half of Harris County residents speak a language other than English at home, so a real Spanish version of key pages is worth weighing.',
      'The sites that win new patients answer the practical questions first: insurance, new patients, location, hours and who the dentists are.',
    ],
    body: `If you run a dental practice in Houston, your website is often the first place a new patient meets you. They found you on a map, tapped through, and now they’re deciding in a few seconds whether to book. At the same time, Texas regulates dental advertising closely, and the rules reach your website as much as a billboard on the Katy Freeway.

The short version: a Texas dental website has to say who owns it, what you offer, where you are and what your dentists are licensed and qualified to do. If you’re a general dentist, you can’t let it read like you’re a specialist. And every claim, review and photo has to be true and verifiable. Build the site around those facts and it does double duty, because the same clarity is what patients and Google both look for.

This is practical guidance based on the board’s published rules, not legal advice. For a close call, check the rule text or ask the Texas State Board of Dental Examiners.

## What Texas requires a dental website to disclose

The Texas Administrative Code has a section written specifically about practice websites. Section 108.59 asks a dental website to disclose who owns the site, the services the practice offers, its office locations and contact details, and the licensing and qualifications of its dentists and associated providers ([22 Tex. Admin. Code § 108.59](${TX_WEBSITE})).

A neighboring rule fills in the details about names. Under Section 108.52, dentists practicing under a trade name have to disclose their full name as it appears on their license or their commonly used name, ads under a trade name must prominently name the owner and at least one practicing dentist at each advertised location, and each owner or principal named in an ad shares responsibility for what it says ([22 Tex. Admin. Code § 108.52](${TX_NAMES})). The same section says professional communications should include each dentist’s degree and either “general dentist” or their recognized specialty.

Turned into a page plan, that looks like this:

- **An owner and team page** that names the owner dentist and every dentist practicing there, with degrees and whether each is a general dentist or a specialist.
- **A services section** that lists what you actually do.
- **A location page for each office** with the address, phone, hours and a map.
- **A clear site owner** in the footer, usually the practice’s legal name.

If you practice under a trade name, the owner’s name and at least one practicing dentist need to be easy to find on the site, not buried in a privacy policy.

## General dentist or specialist: the rule most sites get wrong

This is where Houston practice websites most often drift out of line, usually by accident.

### Who can say “specialist”

Section 108.54 limits the word “specialist” and the terms “specialty” or “board certified” to dentists who qualify in a recognized specialty. It lists twelve, including endodontics, oral and maxillofacial surgery, orthodontics and dentofacial orthopedics, pediatric dentistry, periodontics and prosthodontics. A dentist can qualify through an accredited specialty program of two or more years or through certification by a recognized board, and a specialist is expected to limit practice to the advertised area ([22 Tex. Admin. Code § 108.54](${TX_SPECIALTY})). The section also puts the burden on the practice owner to avoid any implication that the general dentists in the practice are specialists.

### What a general dentist has to add

Plenty of general dentists place implants, do clear aligner cases or handle root canals, and they’re allowed to advertise those services. Section 108.55 says how. When a general dentist advertises specific services, the words “General Dentist” or “General Dentistry” must appear right after the dentist’s name, and that designation must be at least as large as the largest font used for the advertised services ([22 Tex. Admin. Code § 108.55](${TX_GENERAL})). A list of services is fine as long as it doesn’t imply specialization and is clearly separate from that designation.

On a website, the easy places to slip are the hero banner and the services menu. A banner that shouts “IMPLANTS AND ORTHODONTICS” in huge type with the dentist’s name in a small line underneath is exactly the pattern the font-size rule is aimed at. Fix it once in the site design, so every page that names a dentist carries the designation automatically.

![A modern dental operatory with an orange patient chair and overhead light](https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=75)

## Claims, reviews and photos: what Texas treats as misleading

Section 108.57 is the board’s list of what makes dental advertising false, misleading or deceptive ([22 Tex. Admin. Code § 108.57](${TX_MISLEADING})). The parts that matter most for a website:

### No “painless,” no guarantees, no unsupported “best”

Under the rule, claiming that dental work will be free of pain or discomfort is misleading. So is implying your materials or services are better than other providers’ without factual support, or predicting or guaranteeing satisfaction or success. A promise to refund a fee if a patient is unhappy is specifically allowed.

That rules out a lot of familiar dental marketing lines. “Pain-free dentistry” and “Houston’s best dentist” are both risky. What works instead is describing what you actually do: the comfort options you offer, how you explain treatment before you start, how you handle anxious patients. Those are true, specific and more convincing.

### Testimonials have to be real and identifiable

The rule treats testimonials as misleading if they come from someone who isn’t a current patient, contain false or misleading statements, can’t be verified, or leave out the person’s identity. In practice: real current patients, with their permission and their name, in their own words. Never write reviews for patients, and don’t pay for them.

### Before and after photos need consent and a caveat

Photos of actual patients are allowed. The rule requires written consent before you disclose anything that could identify a patient, and an ad with that kind of result should include the statement that actual results may vary ([22 Tex. Admin. Code § 108.57](${TX_MISLEADING})). On a smile gallery page, put that line next to the photos, not only in the footer.

### “Free” and “discount” offers have to be real

The same section treats it as misleading to call a service free or discounted when its cost is built into a companion procedure the patient is charged for. If your new-patient special includes a “free” exam, the exam has to actually be free.

### Keep your old pages

Section 108.60 asks dentists to keep copies of print, broadcast and electronic advertisements for four years after they last appear, along with records of any corrections ([22 Tex. Admin. Code § 108.60](${TX_RECORDS})). Whether that reaches every website version isn’t spelled out, so the cautious move is to keep dated copies of your site when it changes. A website platform that saves every version makes this effortless.

## How Houston patients find a dentist

Getting the rules right keeps you safe. Getting found and chosen is the other half.

### Local search is about the map and the details

Most new patients search something like “dentist near me,” “emergency dentist Houston” or “pediatric dentist Katy.” Google says local results mainly come down to relevance, distance and prominence ([How Google ranks local results](${LOCAL_RANKING})). In a metro area as spread out as Houston, distance does a lot of the sorting, which is why a separate, complete page for each office matters: Sugar Land patients want the Sugar Land address, parking and hours, not a list of four locations.

Keep your name, address and phone identical on your website and your Google Business Profile, choose the category that describes your core practice, and keep hours current, including holidays ([Guidelines for representing your business on Google](${GBP_GUIDELINES})).

### Spanish matters in Harris County

The Census Bureau reports that about 45% of Harris County residents age 5 and over speak a language other than English at home, based on 2020 to 2024 survey data ([U.S. Census Bureau QuickFacts, Harris County](${CENSUS_HARRIS})). If Spanish-speaking patients call your office, real Spanish versions of your key pages, written well and linked to their English versions, help them choose you and help Google show the right language ([Tell Google about localized versions of your page](${HREFLANG})). Only say “hablamos español” if someone at the front desk does. And the Texas advertising rules apply to Spanish pages exactly as they do to English ones, including the “General Dentist” designation.

### Patients decide on practical details

When people compare dental offices, the deciding questions are rarely about technology. They’re about whether you take their insurance, whether you’re accepting new patients, whether you can see them soon and where to park. A site that answers those in the first screen gets more calls than one that opens with a mission statement.

![A dentist examining a patient in a bright treatment room](https://images.unsplash.com/photo-1662837625421-5fd8ed6131a0?auto=format&fit=crop&w=1200&q=75)

## What a strong Houston dental website includes

Put it together and the pages almost write themselves.

### A home page that answers the first questions

Lead with what you are and where: “Family and cosmetic dentistry in the Heights, accepting new patients.” Then a tap-to-call button, a request-an-appointment button, your hours and a short insurance line. On a phone, all of that should be visible without scrolling far.

### A page for each service you want to be found for

Cleanings and exams, emergency visits, crowns, implants, clear aligners, children’s dentistry: each is its own search, so each deserves its own page. Explain what the treatment is, who it’s for, what a visit looks like, and how cost and insurance usually work at your office. If a general dentist provides the service, the designation goes next to their name on that page too.

### Dentist and team profiles

Photo, degree, school, whether they’re a general dentist or which specialty they qualify in, and something personal. Patients choose a person. These pages also carry the license and qualification information Section 108.59 asks for.

### Insurance and payment, in plain words

List the plans you’re in network with, say what you do if a patient’s plan isn’t on the list, and explain any membership or payment options. Keep it current; an outdated insurance list frustrates patients more than a missing one.

### A simple appointment request

Name, phone, email, preferred time and a few words about what they need. Don’t ask for health history on the website form; that belongs in your intake system. Reply quickly, because a patient who requested an appointment from three offices usually books with the first one that calls back.

### Markup, speed and accessibility

Describe each office to Google with structured data as a Dentist, with its name, address, phone and hours ([Local business structured data](${LOCAL_SD}); [schema.org Dentist](${SCHEMA_DENTIST})). Make sure pages load quickly on phones, which Google’s Core Web Vitals help you measure ([Web Vitals](${WEB_VITALS})). And make the site usable with a keyboard and screen reader; the Department of Justice has published guidance on web accessibility under the ADA ([Guidance on web accessibility and the ADA](${ADA_WEB})).

## A Texas dental website checklist

Run through this before launch or your next redesign.

1. The site names its owner, and the owner dentist and at least one practicing dentist are clearly named for each location.
2. Every dentist shows a degree and either “General Dentist” or a recognized specialty they qualify for.
3. Wherever a general dentist is named alongside specific services, “General Dentist” appears right after the name, at least as large as the service names.
4. No “painless,” “guaranteed” or unsupported “best” claims.
5. Testimonials come from real current patients, with their identity and permission.
6. Before and after photos have written consent and an “actual results may vary” note beside them.
7. Any “free” or discounted offer is genuinely free or discounted.
8. Each office has its own page with address, phone, hours and parking, matching your Google Business Profile.
9. Spanish pages, if any, are real translations and follow the same rules.
10. You keep dated copies of the site when it changes.

## Where SaySites fits

SaySites builds practice websites around this structure: a page for each service, provider profiles with real bios and credentials, location details Google can read, structured data that describes your practice, and a speed check every page has to pass before it goes live. SaySites never invents reviews, credentials, results or before and after photos; everything on your site comes from you. Changes are made by saying them in plain words, and every version is saved, so keeping an advertising record is automatic. Plans start at $15 a month ([see dental practice websites](/websites-for/dentists) and [pricing](/pricing)).

You remain responsible for what your site says under the Texas rules. What gets easier is keeping it right: adding a new associate with the right designation, updating your insurance list or adding a consented case to your gallery takes a sentence.

If your current site is slow, vague about who your dentists are or heavy on claims you’d rather not defend, [send it to us for a free redesign](/redesign). Or [start a 7-day free trial](/signup) and build your own. For more on getting chosen in local results, read [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) and [how to ask for Google reviews without breaking the rules](/blog/ask-for-google-reviews-the-right-way).`,
    faq: [
      { q: 'What does Texas require a dental practice website to disclose?', a: 'Section 108.59 of the Texas Administrative Code asks a dental website to disclose who owns the site, the services offered, office locations and contact details, and the licensing and qualifications of the dentists and associated providers. Related rules ask that each dentist’s degree and either “general dentist” or a recognized specialty appear in professional communications.' },
      { q: 'Can a general dentist in Texas advertise implants or orthodontics?', a: 'Yes. A general dentist can advertise specific services but must place “General Dentist” or “General Dentistry” directly after their name, in type at least as large as the largest service name in the ad. The list of services must not imply that the dentist is a specialist, and it should be clearly separate from that designation.' },
      { q: 'Who can call themselves a dental specialist in Texas?', a: 'Only dentists who qualify in one of the recognized specialties, such as endodontics, orthodontics, pediatric dentistry, periodontics or oral surgery. They qualify through an accredited specialty program of two or more years or through certification by a recognized board, and they should limit their practice to the specialty they advertise.' },
      { q: 'Are patient reviews and testimonials allowed on Texas dental websites?', a: 'Yes, with care. Texas treats testimonials as misleading if they come from someone who isn’t a current patient, can’t be verified, contain false statements or leave out the person’s identity. Use real current patients, with their permission and name, in their own words, and never write or pay for reviews.' },
      { q: 'Can I show before and after photos on my dental website in Texas?', a: 'You can show photos of actual patients. Get written consent before showing anything that could identify a patient, and include the statement that actual results may vary next to the photos. Use only your own patients’ real results, and don’t edit images in a way that changes what the treatment achieved.' },
      { q: 'Should my Houston dental website be in Spanish?', a: 'If Spanish-speaking patients call your office, it is worth considering. Census Bureau data shows about 45% of Harris County residents speak a language other than English at home. Real, well-written Spanish pages linked to their English versions help those patients choose you. Only advertise Spanish service if your team can provide it.' },
      { q: 'Can I say “painless dentistry” on my website?', a: 'Texas treats a claim that dental work will be free of pain or discomfort as misleading, so it is best avoided. Describe what you actually offer instead, such as the comfort and sedation options available, how you explain treatment first and how your team works with nervous patients. Specific, true details are more convincing anyway.' },
    ],
    published: '2026-10-10',
    status: 'published',
  },

  {
    slug: 'how-google-picks-local-businesses',
    title: 'How Google decides which local businesses to show',
    description: 'Relevance, distance and prominence: what Google says it looks at for local results, and what a small business can actually do about each one.',
    kind: 'guide',
    summary: [
      'Google says local results mainly come down to relevance, distance and prominence.',
      'You can’t pay for a better local ranking, and distance is out of your hands.',
      'Complete, accurate business details, real reviews and a website that explains what you do are the parts you control.',
    ],
    body: `When someone near you searches for “plumber” or “nail salon” on their phone, Google shows a short list of nearby businesses on the map and in the results. A lot of advice about getting into that list is guesswork. Google’s own help page is short and specific, so it’s the best place to start ([Tips to improve your local ranking on Google](${LOCAL_RANKING})).

## The three things Google names

Google says local results are “mainly based on relevance, distance, and popularity”, and describes them as:

- **Relevance:** how well your Business Profile matches what someone searched for. Google’s advice is to give complete and detailed business information so it can match you to the right searches.
- **Distance:** how far you are from the person searching. If they don’t share their location, Google uses what it knows about where they are.
- **Prominence:** how well known your business is. Google says this is partly based on information like how many websites link to you and how many reviews you have, and that more reviews and positive ratings can help.

It also says plainly that there’s no way to request or pay for a better local ranking. Anyone who promises you the top spot is promising something Google says can’t be bought.

## What you can’t change: distance

You can’t move closer to every customer. What you can do is be accurate about where you are and where you work, so you show up for the people you can actually serve. If you go to customers rather than having them come to you, that means setting a service area instead of a street address.

## What you can change: relevance

Relevance is mostly about being clear. Google lists the details that help: your full address if customers visit you, your hours (including special hours), the category that describes your business, and other details such as parking or Wi-Fi.

Two habits make a real difference:

1. **Pick the category that describes your core business.** Google’s guidelines ask you to choose the fewest categories it takes to describe your overall business ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). More isn’t better.
2. **Say what you do in plain words, everywhere.** Your Business Profile description and your website should both name the services you offer the way customers say them: “water heater repair”, not “thermal solutions”.

## What you can change slowly: prominence

Prominence is earned. Google names reviews and links from other websites. The honest ways to build it are the boring ones: do good work, ask happy customers for a review, and be part of your town (a local association, a sponsorship, a supplier who lists you). Never buy reviews or links; Google’s policies forbid paid reviews outright ([Maps content policy](${MAPS_POLICY})).

## Where your website fits

Your website is where the detail lives. Your profile can only say so much; a page for each service, in your own words, tells Google and customers exactly what you do and where. That supports relevance directly.

## A short checklist

- Verify your Business Profile and keep it up to date.
- Use one accurate category, plus others only if they describe your core business.
- Keep your hours current, including holidays.
- Ask every happy customer for a review, and reply to the reviews you get.
- Give each main service its own page on your website, in your own words.

Every SaySites site lists your services in plain words and tells Google your business details in the format it reads. Your reviews, your profile and your work are still yours to look after.`,
    published: '2026-10-09',
    status: 'published',
  },
  {
    slug: 'ask-for-google-reviews-the-right-way',
    title: 'How to ask for Google reviews without breaking the rules',
    description: 'Google wants more reviews to come from real customers, and it bans incentives. Here’s how to ask often, ask well and stay within the rules.',
    kind: 'guide',
    summary: [
      'Asking customers for a review is encouraged; Google even gives you a link and a QR code for it.',
      'Offering anything in return for a review, including a discount, is against Google’s rules.',
      'Reply to reviews, good and bad, briefly and personally.',
    ],
    body: `Reviews show next to your business on Google Maps and Search, and Google names them as one of the things that help a business stand out ([Tips to get more reviews](${REVIEW_TIPS})). Most small businesses have far fewer reviews than happy customers, simply because they never ask. Here’s how to ask without getting into trouble.

## What Google allows

Google’s own advice is to remind customers to leave reviews. It gives every business a link and a QR code for exactly this, inside your Business Profile. Asking is fine. Asking everyone is fine.

## What Google forbids

Google’s policy is direct: offering incentives, “like free or discounted goods or services”, in exchange for posting a review, changing one or removing a negative one is considered fake and misleading content and is strictly prohibited ([Tips to get more reviews](${REVIEW_TIPS})).

The Maps content policy adds more you shouldn’t do ([Prohibited & restricted content](${MAPS_POLICY})):

- Pay for reviews, directly or in kind.
- Post reviews from several accounts, or ask one person to.
- Ask employees, family or anyone with a conflict of interest to review you.
- Post on a competitor’s listing to hurt them.

That rules out “10% off your next visit for a review” and “enter our prize draw when you review us”. It also rules out asking only the customers you know loved you and quietly skipping the rest, because the policy forbids soliciting content that doesn’t reflect a genuine experience.

## How to ask well

- **Ask at the right moment.** Right after a job is finished and the customer is pleased, not weeks later.
- **Make it one tap.** Send your review link by text or email, or show the QR code at the counter. Google notes customers need to be signed in to a Google Account to leave a review.
- **Ask in your own words.** “If you were happy with the work, a short review on Google helps other people in town find us” is plenty.
- **Ask everyone.** A mix of reviews reads as more believable; Google itself says a mix of positive and negative feedback often feels more trustworthy.

## Reply to what you get

Google suggests replying to reviews, keeping replies short, polite and specific, and not using them to advertise. For a negative review, reply calmly with what you’ll do about it. Future customers read your reply as much as the review.

If a review breaks Google’s policies (for example, it’s clearly not from a customer), you can flag it for Google to look at. You can’t remove a review yourself just because you disagree with it.

## A simple routine

1. Get your review link or QR code from your Business Profile.
2. Send it to every customer when the work is done.
3. Reply to each new review within a few days.

On SaySites, once you add your Google review link, your site gets a short /review address that forwards to it, and you can turn on one review request email after you mark a lead as won. Every customer gets the same request, with nothing offered in return.`,
    published: '2026-10-10',
    status: 'published',
  },
  {
    slug: 'service-area-business-google',
    title: 'No storefront? How to show Google where you work',
    description: 'Plumbers, cleaners and other businesses that go to their customers should set a service area, not a street address. Here’s what Google’s rules say.',
    kind: 'guide',
    summary: [
      'If customers don’t come to your address, Google asks you to remove it from your Business Profile and set a service area instead.',
      'You can list up to 20 service areas by city or postal code; Google says the whole area shouldn’t be more than about two hours’ drive from your base.',
      'Your website should name the places you serve, honestly.',
    ],
    body: `Many small businesses don’t have a shop. A plumber, a mobile dog groomer or a cleaning company goes to the customer. Google treats these as service-area businesses, and it has specific rules for them ([Manage your service areas](${SERVICE_AREAS})).

## Are you a service-area business?

Google describes three kinds:

- **Storefront:** customers come to you, at an address with permanent signage.
- **Service-area business:** you visit or deliver to customers and don’t serve them at your address. Google gives cleaning services and plumbers as examples.
- **Hybrid:** you do both, like a restaurant that also delivers.

Google also says that if your business doesn’t have permanent on-site signage, it isn’t eligible as a storefront and should be listed as a service-area business.

## Hide your address if customers don’t visit

This is the rule people miss. Google says that if you don’t serve customers at your business address, you should remove the address from your Business Profile. Working from home doesn’t mean you’re invisible on Google; it means you show a service area instead of a pin.

## Setting your service area

In your Business Profile, under Edit profile and Location, you can add service areas. Google’s rules:

- Up to 20 service areas, set by city, postal code or a similar area.
- No radius around your base (older radius settings can’t be edited).
- The whole area shouldn’t be more than about two hours of driving time from where you’re based.
- A service-area business can have only one profile for the whole area it serves.

Pick the places you genuinely want work from. Listing far-off towns you’d never drive to doesn’t help anyone.

## What to put on your website

Your website should agree with your profile:

- Say where you’re based and which towns or neighborhoods you serve, in a sentence a person would write.
- Don’t create a near-identical page for every town with only the name swapped. Google’s guidance on helpful content warns against pages made mainly to attract search visits rather than to help people ([Creating helpful, reliable, people-first content](${HELPFUL})).
- If you do write about a particular town, write something true and specific to it: the jobs you do there, how quickly you can get there, local details customers care about.

## Stay consistent

Google’s guidelines ask you to represent your business the way it’s known in the real world, with an accurate and precise address or service area ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). Use the same name and phone number on your profile, your website and anywhere else you’re listed.

SaySites sites tell Google the area you serve in their business details, and your site never shows a street address unless you give us one.`,
    published: '2026-10-11',
    status: 'published',
  },
  {
    slug: 'page-titles-and-descriptions-that-get-clicks',
    title: 'Page titles and descriptions that people actually click',
    description: 'The title and short description under it are often all a searcher sees. What Google’s guidance says about writing them, with examples for local businesses.',
    kind: 'guide',
    summary: [
      'Every page needs its own clear title; avoid vague ones like “Home” and repeated boilerplate.',
      'Google writes the description under your result mostly from the page itself, and sometimes uses your meta description.',
      'Write for the person searching: what you do, where, and why they should pick you.',
    ],
    body: `In a list of search results, your page gets a title and a line or two of description. That’s often all someone reads before deciding whether to tap. Google has clear guidance on both, and following it is one of the cheapest improvements a small business can make.

## Titles: what Google asks for

Google calls the clickable headline a “title link” and builds it mainly from your page’s title ([Influencing your title links](${TITLE_LINKS})). Its advice:

- **Every page should have a title.**
- **Be descriptive and concise.** Avoid vague titles like “Home”.
- **Don’t stuff keywords.** Repeating “plumber, plumbing, plumbers” can look spammy to Google and to people.
- **Avoid repeated boilerplate.** Each page should have distinct text that describes that page.
- **Brand concisely.** Your business name can go in the title, but it shouldn’t crowd out what the page is about.

Google also notes there’s no fixed length limit, but long titles get cut off to fit the screen.

## Good and bad examples

- Weak: “Home”
- Weak: “Plumber Plumbing Plumbers Best Plumber Tampa”
- Better: “Rivera Plumbing | Plumber in Tampa, FL”
- For a service page: “Water Heater Repair in Tampa | Rivera Plumbing”

The better versions say what the page is, where, and who you are, once each.

## Descriptions: what Google actually shows

The text under your title is called a snippet. Google says snippets are created primarily from the page content itself, and that it sometimes uses your meta description if that describes the page more accurately ([Control your snippets](${SNIPPETS})). It may also show different snippets for different searches.

So two things matter:

1. **Your page should explain itself early.** The first paragraph of a service page should say what you do, for whom, and where.
2. **Your meta description should be a real summary.** Google describes a good one as a short, relevant pitch that tells people the page is exactly what they’re looking for. Like titles, there’s no length limit, but long ones are cut to fit.

## Write it for a person

A useful test: read your title and description as if you were the customer, on a phone, comparing three businesses. Would you know what this page offers? Would you know the business is near you? Is there a reason to choose it, stated plainly and truthfully, such as “Free estimates” if you really give them, or “Open Saturdays” if you are?

Don’t promise what you can’t back up. “Best in Florida” is a claim; “Family-run since 2009” is a fact, if it’s true.

## Check yours today

Search for your business name and your main service plus your town. Look at what Google shows for your pages. If a title says “Home” or every page has the same one, fix those first.

SaySites gives every page its own title and description when your site is built, flags duplicates or short ones in the SEO tab, and lets you fix them in one click.`,
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'is-your-website-fast-enough',
    title: 'Is your website fast enough? Core Web Vitals in plain English',
    description: 'Google measures how fast your pages load, react and settle. What the three Core Web Vitals mean, the targets Google sets, and how to check your own site free.',
    kind: 'guide',
    summary: [
      'Core Web Vitals measure loading (LCP), responsiveness (INP) and visual stability (CLS).',
      'Google’s targets: main content within 2.5 seconds, a response within 200 milliseconds, and a layout shift score of 0.1 or less.',
      'You can check any page free with PageSpeed Insights.',
    ],
    body: `Most of your customers will see your website on a phone, often on a patchy connection. If it’s slow, some of them leave before it loads. Google measures this with three numbers it calls Core Web Vitals, and explains them in detail on web.dev ([Web Vitals](${WEB_VITALS})).

## The three numbers

**Largest Contentful Paint (LCP): how fast it loads.** The time until the biggest thing on the screen, usually your main photo or headline, appears. Google’s target is within 2.5 seconds of the page starting to load.

**Interaction to Next Paint (INP): how fast it reacts.** When someone taps a button or opens a menu, how long until the page responds. The target is 200 milliseconds or less.

**Cumulative Layout Shift (CLS): how steady it is.** Whether things jump around while the page loads, like a button moving just as you tap it. The target is a score of 0.1 or less.

Google suggests judging a site by the 75th percentile of visits, on both phones and computers: in other words, most of your visitors should get a good experience, not just the ones on fast Wi-Fi.

## Why it matters for a small business

A slow page costs you the impatient visitor, and on a phone that’s a lot of visitors. Google also says its core ranking systems look to reward content that gives a good page experience ([Creating helpful, reliable, people-first content](${HELPFUL})). Speed won’t make up for a page that doesn’t answer the question, but it removes a reason for people to give up.

## Check your own site in two minutes

1. Open [PageSpeed Insights](${PAGESPEED}).
2. Paste your home page address and run it.
3. Look at the phone results first.

If your site has enough visitors, you’ll see real-world numbers from Chrome users at the top. Below that is a lab test, a simulated load on a mid-range phone, with a score out of 100 and a list of what’s slowing the page down.

## Don’t chase the score alone

The lab score changes a little every time you run it, and a perfect 100 isn’t the goal. What matters is that real visitors on real phones see your page quickly and can use it straight away. If the real-world numbers at the top are good, small swings in the lab score aren’t worth worrying about. If there aren’t enough visitors for real-world numbers yet, use the lab test as your guide and re-check after every big change, like a new photo gallery or a booking widget.

## The usual culprits

- **Huge photos.** A photo straight from a camera can be many times larger than the screen needs.
- **Too many add-ons.** Chat widgets, pop-ups, trackers and tag managers each load their own code.
- **Fonts and sliders.** Several custom fonts and auto-playing carousels add weight and cause jumps.
- **Cheap or overloaded hosting.** Slow servers delay everything.

Fixing these usually means removing things rather than adding them. Ask of every add-on: does this bring in customers, or just weight?

SaySites sites send no JavaScript to visitors, size every photo for the screen, and every page has to pass our speed check (a mobile score of 95 or more) before it can go live.`,
    published: '2026-10-13',
    status: 'published',
  },
  {
    slug: 'what-to-put-on-your-home-page',
    title: 'What to put on your home page so visitors get in touch',
    description: 'A small business home page has one job: help the right visitor decide to call or send a message. A practical, section-by-section guide.',
    kind: 'guide',
    summary: [
      'Say what you do and where in the first screen, in plain words.',
      'Make calling and sending a message easy from anywhere on the page.',
      'Show proof that’s real: your own photos, real reviews, real details. Never invent any.',
    ],
    body: `A visitor lands on your home page with a question: can this business help me, and can I trust them? Everything on the page should help them answer it quickly. Here’s a simple order that works for most local businesses. It isn’t a formula from Google; it’s plain good sense, and it lines up with Google’s advice to make pages for people first ([Creating helpful, reliable, people-first content](${HELPFUL})).

## 1. The first screen: what, where, how to reach you

Before anyone scrolls, they should know:

- **What you do,** in the words customers use. “Emergency plumbing and water heaters”, not “Solutions for your home”.
- **Where.** Your town or the area you serve.
- **How to get in touch.** A phone number they can tap and a button to send a message.

One clear headline, one sentence under it, and two buttons is enough. A strong photo of your real work, team or premises helps more than a stock image.

## 2. Your main services

List your main services with a line each about what’s included, and link each to its own page with the detail. Visitors scan for their problem; let them find it in seconds.

## 3. Why you

This is where most sites say “quality service at affordable prices”, which says nothing. Say something specific and true instead:

- How you work (“We give you a written price before we start”).
- How long you’ve been doing it, if it’s worth saying.
- Licences, certifications or memberships you really hold.
- The area you cover and when you’re available.

## 4. Proof

Real reviews from real customers, quoted word for word. Photos of jobs you’ve actually done. Never invent a testimonial, a number of happy customers or an award; it’s dishonest, and fake reviews break Google’s policies ([Maps content policy](${MAPS_POLICY})).

## 5. Answers to the questions people ask

Three to five short questions and answers: which areas you cover, how pricing works, how soon you can help, what happens first. These save you phone calls and help visitors decide.

## 6. One more way to get in touch

End the page with a short form and your phone number again. Someone who has read this far is ready; don’t make them scroll back up.

## What to leave out

- Pop-ups that cover the page on a phone.
- Auto-playing sliders that rotate before people can read them.
- Long paragraphs about your mission before you’ve said what you do.

## Check it on a phone

Open your home page on your phone and give yourself five seconds. Do you know what the business does, where, and how to call? If not, fix the first screen first.

SaySites builds every new site in this order, with a call button that stays on screen on phones and a request form on the home page. You change any of it by saying what you want.`,
    published: '2026-10-14',
    status: 'published',
  },
  {
    slug: 'google-business-profile-or-website',
    title: 'Google Business Profile or a website: do you need both?',
    description: 'A free Business Profile puts you on Google Maps. A website is the part you own and control. What each does well, and why most small businesses need both.',
    kind: 'guide',
    summary: [
      'Your Business Profile is how you appear on Google Maps and in local results; it’s free and worth setting up today.',
      'Your website holds the detail a profile can’t: a page per service, your story, your answers.',
      'Google lists links from other sites among the things that help local ranking, and your website is what they link to.',
    ],
    body: `If you have a Google Business Profile with good reviews, it’s fair to ask whether you need a website at all. The short answer for most small businesses is yes. They do different jobs, and each makes the other work better.

## What your Business Profile does

Your Business Profile is the panel and map pin people see when they search for you or for businesses like yours nearby. You can add your hours, category, photos, services and a description, and you can collect reviews. It’s free. If you haven’t claimed yours, do it first ([Add or claim your Business Profile](https://support.google.com/business/answer/2911778)).

Google lists keeping that information complete and accurate as one of the main ways to improve your local ranking ([Tips to improve your local ranking](${LOCAL_RANKING})).

## What a profile can’t do

- **Room for detail.** A profile gives you a description field and a services list. It can’t hold a full page about each service, your prices, your process or answers to the questions customers ask.
- **Ownership.** The profile lives on Google’s platform under Google’s rules ([Guidelines for representing your business](${GBP_GUIDELINES})). Your website is yours: your words, your design, your address on the web.
- **Searches beyond the map.** Many searches show ordinary web results as well as the map. Pages on your website can appear there for the specific questions people ask.

## How they help each other

Google says prominence, one of the three main local ranking factors, is partly based on information like how many websites link to your business ([Tips to improve your local ranking](${LOCAL_RANKING})). Links point to websites. A local association, a supplier or a newspaper can link to your site; it’s much harder for them to link meaningfully to a map pin.

And your profile has a website field. Someone who finds you on Maps and wants to know more taps through to your site. If there’s nothing there, or an outdated page, you lose them at the point they were most interested.

## What your website needs, at minimum

- A clear home page: what you do, where, and how to get in touch.
- A page for each main service.
- The same name, phone number and address (or service area) as your profile.
- A way to send a message, so customers can reach you outside opening hours.

## Keep them in step

Whenever something changes, like new hours, a new service or a new phone number, update both on the same day. Customers notice when the two disagree, and a wrong phone number on either one is a lost call.

## The bottom line

Set up your Business Profile today; it’s free and it’s how you show up on the map. Then make sure the website it points to is fast, clear and yours.

SaySites puts your business name, phone number and area into your site’s details for Google, so your website and your profile tell the same story.`,
    published: '2026-10-15',
    status: 'published',
  },
]
