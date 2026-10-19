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

const IL_ART8 = 'https://www.illinoiscourts.gov/rules/supreme-court-rules?a=viii'
const IL_71 = 'https://www.illinoiscourts.gov/resources/4ebe98db-481b-40d2-9846-c7986e2abe72/file'
const IL_72 = 'https://www.illinoiscourts.gov/resources/39c73f58-b094-4603-84a9-a590a1f17b97/file'
const IL_73 = 'https://www.illinoiscourts.gov/resources/f043b2de-4071-42b8-b0e9-5d2064cb5202/file'
const IL_74 = 'https://www.illinoiscourts.gov/resources/529c1e00-1f0a-4943-9876-adba5f78cd39/file'
const IL_75 = 'https://www.illinoiscourts.gov/resources/ae11ea70-ed9d-46fd-a5ae-6d722cd27217/file'
const IL_ICS_NEWS = 'https://www.illinoiscourts.gov/News/1534/Supreme-Court-approves-3-proposals-impacting-the-practice-of-law-in-Illinois/news-detail/'
const IL_AI_POLICY = 'https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/e43964ab-8874-4b7a-be4e-63af019cb6f7/Illinois%20Supreme%20Court%20AI%20Policy.pdf'
const ARDC_AI = 'https://www.iardc.org/EducationAndOutreach/ArtificialIntelligence'
const ARDC_2025 = 'https://www.iardc.org/Files/AnnualReports/AnnualReport2025.pdf'
const ISBA_9610 = 'https://www.isba.org/ethics/opinions/9610'
const ISBA_1204 = 'https://www.isba.org/ethics/opinions/1204'
const ISBA_2202 = 'https://www.isba.org/ethics/opinions/2202'
const ISBA_2402 = 'https://www.isba.org/ethics/opinions/2402'
const ISBA_2502 = 'https://www.isba.org/ethics/opinions/2502'
const COOK_ORG = 'https://www.cookcountycourt.org/about/organization-court'
const COOK_FIRST = 'https://www.cookcountycourt.org/district/first-municipal-district-chicago'
const ILND = 'https://www.ilnd.uscourts.gov/'
const CENSUS_CHI_COOK = 'https://www.census.gov/quickfacts/fact/table/chicagocityillinois,cookcountyillinois/PST045224'

const TX_164_1 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-164-1'
const TX_164_2 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-164-2'
const TX_164_3 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-164-3'
const TX_164_4 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-164-4'
const TX_169_25 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-169-25'
const TX_169_26 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-169-26'
const TX_169_27 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-169-27'
const TX_169_28 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-169-28'
const TX_177_2 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-177-2'
const TX_193_17 = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-193-17'
const OC_101 = 'https://statutes.capitol.texas.gov/Docs/OC/htm/OC.101.htm'
const OC_172 = 'https://statutes.capitol.texas.gov/Docs/OC/htm/OC.172.htm'
const HS_401 = 'https://statutes.capitol.texas.gov/Docs/HS/htm/HS.401.htm'
const HB3749_HIST = 'https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=HB3749'
const HB3749_TEXT = 'https://capitol.texas.gov/tlodocs/89R/billtext/html/HB03749F.htm'
const TDLR_LAS = 'https://www.tdlr.texas.gov/las/las.htm'
const FTC_REVIEWS = 'https://www.govinfo.gov/content/pkg/FR-2024-08-22/pdf/2024-18519.pdf'
const FTC_ENDORSE = 'https://www.govinfo.gov/content/pkg/FR-2023-07-26/pdf/2023-14795.pdf'
const FDA_FILLERS = 'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers'
const FDA_BOTOX = 'https://www.fda.gov/drugs/drug-alerts-and-statements/counterfeit-version-botox-found-multiple-states'
const HHS_TRACKING = 'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/index.html'
const CENSUS_DAL = 'https://www.census.gov/quickfacts/fact/table/dallascitytexas/PST045224'

const PA_ORDER = 'https://www.pacourts.us/assets/opinions/Supreme/out/Order%20Entered%20-%20106105653284483483.pdf?cb=1'
const PA_ADV_NEWS = 'https://padisciplinaryboard.org/news-media/news-article/3866/supreme-court-adopts-amendments-to-advertising-and-solicitation-rules'
const PA_RPC = 'https://www.padisciplinaryboard.org/for-attorneys/rules/rule/3/the-rules-of-professional-conduct'
const PBA_2014_300 = 'https://inns.innsofcourt.org/media/150090/03-16-17%20-%202%20PA%20FO%202014-300.pdf'
const PA_AI_OPINION = 'https://lawnext.com/wp-content/uploads/2024/06/Joint-Formal-Opinion-2024-200.pdf'
const PHL_FAMILY = 'https://courts.phila.gov/common-pleas/family'
const PHL_MC_CIVIL = 'https://www.courts.phila.gov/municipal/civil/'
const PHL_CRIMINAL = 'https://www.courts.phila.gov/common-pleas/trial/criminal/'
const PHL_MASS_TORT = 'https://www.courts.phila.gov/pdf/cpcivil/Mass-Tort-Docket-and-Liaison-Counsel-List.pdf'
const EDPA = 'https://www.paed.uscourts.gov/'
const PA_DB_2025 = 'https://www.padisciplinaryboard.org/Storage/media/pdfs/20260319/145428-2025annualreport.pdf'
const CENSUS_PHL = 'https://www.census.gov/quickfacts/philadelphiacitypennsylvania'
const CSLB_ADS = 'https://cslb.ca.gov/Resources/GuidesAndPublications/AdvertisingGuidelines.pdf'
const CSLB_ADS_BULLETIN = 'https://cslb.ca.gov/Resources/IndustryBulletins/2020/20-21_Advertising_on_Vehicles.pdf'
const CSLB_LOOKUP = 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx'
const CSLB_C10 = 'https://www.cslb.ca.gov/about_us/library/licensing_classifications/Licensing_Classifications_Detail.aspx?Class=C10'
const CSLB_MINOR = 'https://cslb.ca.gov/Resources/IndustryBulletins/2024/AB%202622%20Implementation.FINAL.pdf'
const DIR_ECU = 'https://www.dir.ca.gov/dlse/ecu/electricaltrade.html'
const SD_ELEC = 'https://www.sandiego.gov/development-services/permits/electrical-permit'
const SD_SIMPLE = 'https://www.sandiego.gov/development-services/permits/electrical-permit/simple'
const SD_IB187 = 'https://www.sandiego.gov/development-services/forms-publications/information-bulletins/187'
const SD_SOLAR = 'https://www.sandiego.gov/development-services/permits/solar-photovoltaic-permit'
const COUNTY_EV = 'https://www.sandiegocounty.gov/content/sdc/sustainability/ev-consumerguide/charger/installation.html'
const SDGE_GEN = 'https://www.sdge.com/more-information/customer-generation'
const SDGE_SBP = 'https://www.sdge.com/solar/solar-billing-plan'
const SDGE_PROJECTS = 'https://www.sdge.com/myprojectcenter'
const SDGE_PSPS = 'https://www.sdge.com/wildfire-safety/psps-more-info'
const SDGE_GENERATORS = 'https://www.sdge.com/more-information/safety/emergency-preparedness/electric-generators'
const CEC_2022 = 'https://www.energy.ca.gov/sites/default/files/2021-08/CEC_2022_EnergyCodeUpdateSummary_ADA.pdf'
const CEC_2025 = 'https://www.energy.ca.gov/sites/default/files/2024-12/2025_Energy_Code_Summary_ADA.pdf'
const CENSUS_SD = 'https://www.census.gov/quickfacts/sandiegocitycalifornia'
const LSA_START = 'https://support.google.com/localservices/answer/6224841'
const SCHEMA_ELECTRICIAN = 'https://schema.org/Electrician'

const AZ_ORDER = 'https://www.azcourts.gov/Portals/0/20/2020%20Rules/Order-R200030.pdf?ver=jAV3etzHom7Ip5fNxtkrzA%3d%3d'
const AZ_GUIDE = 'https://www.azbar.org/for-legal-professionals/ethics/best-practices/er-7-1-communications-concerning-a-lawyer-s-services-and-er-7-3-solicitation-of-new-clients'
const AZ_BLS = 'https://www.azbar.org/for-legal-professionals/career-advancement/legal-specialization/'
const AZ_ABS_NEWS = 'https://www.azcourts.gov/Portals/0/201/Press%20Releases/2020Releases/082720RulesAgenda.pdf'
const AZ_ABS = 'https://www.azcourts.gov/cld/Alternative-Business-Structure'
const AZ_7209 = 'https://www.azcourts.gov/Portals/0/0/admcode/pdfcurrentcode/7-209%20Alternative%20Business%20Structures%2003_2026.pdf?ver=fog-AzgjRxoB0r2bFCwjXw%3d%3d'
const AZ_LP = 'https://www.azcourts.gov/cld/Legal-Paraprofessional'
const AZ_7210 = 'https://www.azcourts.gov/Portals/0/0/admcode/pdfcurrentcode/7-210%20Legal%20Paraprofessional%20Amended%2010-2025.pdf?ver=Ddm1giI5UAxTqsb0meD3AQ%3d%3d'
const AZ_CENSUS = 'https://www.census.gov/quickfacts/fact/table/phoenixcityarizona,US/PST045221'
const AZ_BAR_REPORT = 'https://azbar.org/media/isdkyrww/2024annreportfor2023published.pdf'
const AZ_COURTS = 'https://superiorcourt.maricopa.gov/court-locations/'
const AZ_JUSTICE = 'https://justicecourts.maricopa.gov/about-us/about-the-justice-courts/'
const AZ_MUNI = 'https://www.phoenix.gov/court'
const AZ_FED = 'https://www.azd.uscourts.gov/content/phoenix'
const SD_GUIDELINES = 'https://developers.google.com/search/docs/appearance/structured-data/sd-policies'
const GA_ADV = 'https://www.law.cornell.edu/regulations/georgia/Ga-Comp-R-Regs-R-150-10-.01'
const GA_SPEC = 'https://www.law.cornell.edu/regulations/georgia/Ga-Comp-R-Regs-R-150-11-.01'
const GA_STATUTE = 'https://law.onecle.com/georgia/title-43/43-11-47.html'
const NCRDSCB = 'https://ncrdscb.ada.org/recognized-dental-specialties'
const FTC_PRESS = 'https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials'
const FTC_FR = 'https://www.govinfo.gov/content/pkg/FR-2024-08-22/html/2024-18519.htm'
const FTC_4654 = 'https://www.law.cornell.edu/cfr/text/16/465.4'
const FTC_4657 = 'https://www.law.cornell.edu/cfr/text/16/465.7'
const HHS_NEWVISION = 'https://www.hhs.gov/about/news/2022/12/14/hhs-civil-rights-office-enters-settlement-with-dental-practice-over-disclosures-of-patients-protected-health-information.html'
const HHS_ELITE = 'https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/elite/index.html'
const HHS_504 = 'https://www.law.cornell.edu/cfr/text/45/84.84'
const HHS_504_EXT = 'https://www.federalregister.gov/documents/2026/05/11/2026-09266/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web'
const PEACHCARE = 'https://dch.georgia.gov/peachcare-kids'
const MARTA = 'https://www.itsmarta.com/'
const GA_CENSUS = 'https://www.census.gov/quickfacts/fact/table/atlantacitygeorgia/PST120223'

const MA_71 = 'https://www.mass.gov/supreme-judicial-court-rules/rules-of-professional-conduct-rule-71-communications-concerning-a-lawyers-services'
const MA_72 = 'https://www.mass.gov/supreme-judicial-court-rules/rules-of-professional-conduct-rule-72-communications-concerning-a-lawyers-services-specific-rules'
const MA_73 = 'https://www.mass.gov/supreme-judicial-court-rules/rules-of-professional-conduct-rule-73-solicitation-of-clients'
const MA_COURTS_BOS = 'https://www.mass.gov/info-details/courts-serving-boston'
const CENSUS_BOS = 'https://census.gov/quickfacts/fact/table/bostoncitymassachusetts/PST120223'
const GBP_PRACTITIONERS = 'https://support.google.com/business/answer/3038177?hl=en'
const FL_64B8 = 'https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-64B8-11-001'
const FL_458_3312 = 'https://m.flsenate.gov/Statutes/458.3312'
const FL_456_062 = 'https://www.flsenate.gov/Laws/Statutes/2025/456.062'
const FL_456_47 = 'https://flsenate.gov/Laws/Statutes/2026/456.47'
const CENSUS_MIA_CITY = 'https://census.gov/quickfacts/fact/table/miamicityflorida,miamidadecountyflorida/PST045221'

const GA_ORDER = 'https://www.gabar.org/news-events-publications/news-archive/view/2025/11/20/supreme-court-of-georgia-approves-amendments-to-the-rules-and-regulations-of-the-state-bar-of-georgia'
const GA_RPC = 'https://www.gabar.org/general-counsel/georgia-rules-of-professional-conduct'
const GA_71 = 'https://www.gabar.org/handbook?rule=rule145'
const GA_72 = 'https://www.gabar.org/handbook?rule=rule147'
const GA_73 = 'https://www.gabar.org/handbook?rule=rule149'
const ATL_LRIS = 'https://atlantabar.org/?pg=History'
const FULTON_SUP = 'https://www.fultoncourt.org/'
const CENSUS_ATL = 'https://www.census.gov/quickfacts/fact/table/atlantacitygeorgia/PST045225'
const CENSUS_GWN = 'https://www.census.gov/quickfacts/fact/table/gwinnettcountygeorgia/PST045225'
const LNI_PC = 'https://lni.wa.gov/licensing-permits/plumbing/licensed-plumbing-contractor/licensing-requirements'
const LNI_FAQ = 'https://www.lni.wa.gov/licensing-permits/plumbing/licensed-plumbing-contractor/licensing-requirement-faqs'
const LNI_VERIFY = 'https://secure.lni.wa.gov/verify/'
const RCW_106_400 = 'https://app.leg.wa.gov/RCW/default.aspx?cite=18.106.400'
const RCW_106_020 = 'https://app.leg.wa.gov/RCW/default.aspx?cite=18.106.020'
const RCW_27_100 = 'https://app.leg.wa.gov/RCW/default.aspx?cite=18.27.100'
const WAC_430 = 'https://app.leg.wa.gov/WAC/default.aspx?cite=296-400A-430'
const SPU_SS = 'https://www.seattle.gov/utilities/construction-resources/sewer-and-drainage/side-sewer-permits'
const SEA_SS_MOVE = 'https://buildingconnections.seattle.gov/2025/10/01/side-sewer-work-transfers-to-seattle-public-utilities/'
const SDOT_SS = 'https://seattlegov.zendesk.com/hc/en-us/articles/1500004813821-SDOT-Right-of-Way-Work-Side-Sewer-FAQs'
const KC_PERMITS = 'https://kingcounty.gov/en/dept/dph/health-safety/environmental-health/plumbing-gas-piping/applications-and-permits'
const KC_HIRE = 'https://kingcounty.gov/en/dept/dph/health-safety/environmental-health/plumbing-gas-piping/hire-registered-contractor'
const CENSUS_SEA = 'https://www.census.gov/quickfacts/fact/table/seattlecitywashington/PST045225'

export const SCHEDULED_ARTICLES: Article[] = [
  {
    slug: 'atlanta-law-firm-website-design',
    title: 'Atlanta Law Firm Website Design: Georgia’s 2026 Rules',
    description: 'Plan an Atlanta law firm website under Georgia’s Rules 7.1 to 7.3 as amended March 1, 2026: contact details, specialty wording, the 30-day rule and more.',
    kind: 'guide',
    summary: [
      'The Supreme Court of Georgia amended Rules 7.1, 7.2 and 7.3 by order of November 18, 2025, effective March 1, 2026, and left 7.4 and 7.5 reserved.',
      'Every page that advertises your services needs the name and contact information of at least one responsible lawyer or firm (Rule 7.2(d)).',
      'Georgia lets a lawyer say “specialist” based on experience, training or education, or a certification from a recognized and bona fide professional entity, as long as it isn’t misleading.',
      'Written outreach about an accident or injury is off limits for 30 days after it happens (Rule 7.3(c)(3)), which matters for email and text follow-ups.',
      'Metro Atlanta is not one audience: 12.2% of Atlanta residents speak a language other than English at home, against 38.1% in Gwinnett County.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1610741686854-5948cd981569?auto=format&fit=crop&w=1600&q=75', alt: 'Downtown Atlanta’s office towers, including the pointed spire of a tall granite skyscraper, against a pale evening sky with dark pine trees in the foreground' },
    body: `An Atlanta law firm website now answers to Georgia’s rewritten advertising rules, which took effect on March 1, 2026. For a website, they come down to five habits. Tell the truth and don’t leave out the facts that keep a statement honest (Rule 7.1). Put the name and contact information of a responsible lawyer or firm on every advertising page (Rule 7.2(d)). Call yourself a specialist only when your experience, training, education or a bona fide certification backs it up (Rule 7.2(c)). Pay for advertising and leads, never for recommendations (Rule 7.2(b)). And keep your follow-up to accident and injury victims in line with the 30-day limit on written solicitations (Rule 7.3(c)(3)). Then build pages for the part of metro Atlanta you actually serve, because Midtown, Decatur and Gwinnett clients don’t search the same way.

Below, each point is tied to the rule text published in the State Bar of Georgia’s handbook, followed by Atlanta-specific advice on courts, languages, Google Business Profile and a page plan. It is a guide to building a compliant website, not an ethics opinion: the State Bar’s Office of the General Counsel and the rules themselves decide close questions.

## What changed in Georgia’s lawyer advertising rules in 2026?

The State Bar reported that the Supreme Court of Georgia, by order dated November 18, 2025, amended Rule 7.1 (communications concerning a lawyer’s services), Rule 7.2 (specific rules) and Rule 7.3 (solicitation of clients), with Rules 7.4 and 7.5 now marked reserved, all effective March 1, 2026 ([State Bar announcement](${GA_ORDER})). The current text is in the [Georgia Rules of Professional Conduct](${GA_RPC}): [Rule 7.1](${GA_71}), [Rule 7.2](${GA_72}) and [Rule 7.3](${GA_73}).

The practical consequence for a firm with an existing site is simple: any disclaimer, footer or “attorney advertising” notice written before March 2026 was written for rules that no longer read the same way. Pull up your current disclaimer page and compare each sentence with the rules as they stand today. Delete language that cites old rule numbers, and add what the new text asks for.

One feature of Georgia’s version stands out: each of the three rules ends with the sentence “The maximum penalty for a violation of this rule is disbarment.” That doesn’t make a sloppy home page a disbarment case, but it is a clear signal that the Supreme Court treats advertising as part of professional conduct, not marketing trivia.

## What must every page of a Georgia law firm website show?

Rule 7.2(d) reads: “Any communication made under this Rule must include the name and contact information of at least one lawyer or law firm responsible for its content.” Comment [11] explains that contact information includes “a website address, a telephone number, an e-mail address or a physical office location.”

Notice the two parts. Some states ask only for a name; Georgia asks for a name and a way to reach the responsible lawyer or firm. On a website the clean way to satisfy both on every page is a footer with:

- the firm’s full name as registered,
- a phone number and office address (or at least one of the forms of contact the comment lists), and
- on the disclaimer page, the name of the lawyer responsible for the site’s content.

Landing pages built for ads are where firms slip. A stripped-down page with a headline, a form and nothing else can fail Rule 7.2(d) even when the main site is fine. Give every landing page the same footer.

## Can an Atlanta lawyer say “specialist” or “certified”?

Georgia is more permissive here than many states, but the permission has a condition. Rule 7.2(c) lets a lawyer say she does or doesn’t practice in particular fields. It continues: a lawyer “who is a specialist in a particular field of law by experience, specialized training or education, or is certified by a recognized and bona fide professional entity, may communicate such specialty or certification so long as the statement is not false or misleading.”

Comment [9] confirms that words like “concentrates in,” “specialist,” “specialty” and “specializes in” are generally allowed on that basis, subject to Rule 7.1’s false-and-misleading standard. Comment [10] notes the long-standing designations for patent practice before the Patent and Trademark Office and for admiralty practice.

So the test for every bio and practice page is whether the claim has a reasonable factual foundation. Comment [2] to Rule 7.1 says a truthful statement is misleading if it is likely to lead a reasonable person to a specific conclusion about the lawyer “for which there is no reasonable factual foundation.” Three practical rules follow:

1. **Back up “specializes in” with facts on the same page.** Years in the field, the share of the practice devoted to it, published work or relevant training. A first-year associate described as a “workers’ compensation specialist” is the kind of claim that invites trouble.
2. **Name the certifying body.** If a lawyer holds a certification, write out the organization’s name next to it. A reader can’t judge whether an entity is “recognized and bona fide” if they can’t see who it is.
3. **Watch the places nobody proofreads.** Page titles, meta descriptions, image alt text and structured data can all repeat a claim out of context. A page title like “Atlanta’s Top DUI Specialists” makes a claim about every lawyer at the firm and adds a comparison you would need to substantiate.

![The Georgia State Capitol in Atlanta, its gold dome and columned portico rising above green trees and a wide lawn under a bright blue sky](https://images.unsplash.com/photo-1641998112073-bb7f8f16819f?auto=format&fit=crop&w=1200&q=75)

## How should an Atlanta firm present results, fees and urgency?

Comment [3] to Rule 7.1 is the one to keep beside you when writing a results page. It warns that a truthful report of achievements can mislead if it leads a reasonable person to form “an unjustified expectation that the same results could be obtained for other clients in similar matters” without regard to each client’s facts. It also covers unsubstantiated claims about fees and comparisons with other firms, and adds that a suitable disclaimer “may preclude a finding” that a statement misleads.

For an Atlanta firm, that translates into a results page that lists the type of case, the court or county, whether the figure was a verdict or a settlement, and a plain-language note directly under the list that past results don’t predict future ones. Leave out superlatives you can’t prove, such as “highest settlements in Fulton County.”

Georgia’s comment [2] adds a point many sites overlook. A truthful statement is also misleading if it is presented so that a reasonable person “would believe the lawyer’s communication requires that person to take further action when, in fact, no action is required.” Countdown banners, “Respond within 48 hours” pop-ups and pages styled like official notices are risky on a law firm site. If a real deadline exists, such as a statute of limitations, explain it accurately and link to the source rather than manufacturing urgency.

Fees are worth publishing. Comment [1] to Rule 7.2 lists “the basis on which the lawyer’s fees are determined, including prices for specific services and payment and credit arrangements” among the information a lawyer may share. If you handle uncontested divorces, simple wills, traffic tickets or business formations for a flat fee, saying so on the page answers the question most visitors want answered before they call. Say what the fee includes, what it excludes, and the date it was last reviewed.

## Who can a Georgia firm pay: directories, lead generators and referral services?

Rule 7.2(b) bars giving anything of value for recommending a lawyer, then lists exceptions. The ones that matter most online:

- **Advertising costs.** Comment [3] names online directory listings, domain-name registrations, sponsorship fees and internet ads, and confirms a lawyer may pay website designers and other marketing vendors.
- **Directories that don’t vouch for you.** Comment [2] defines a recommendation as something that “endorses or vouches for” a lawyer’s credentials or abilities, and says directory listings and group ads that list lawyers by practice area, “without more,” are not recommendations. A paid “Top Lawyer” badge that implies an endorsement is a different matter.
- **Lead generators, with limits.** Under comment [5], a lead generator must not recommend you, payments must be consistent with Rules 1.5(f) and 5.4, and its own communications must meet Rule 7.1. You must not pay one that implies it is recommending you, that the referral is free, or that it “has analyzed a person’s legal problems” to pick a lawyer.
- **Bar-operated referral services.** Georgia’s Rule 7.2(b)(3) specifically allows paying a bar-operated nonprofit referral service a fee calculated as a percentage of fees earned, if the service meets conditions set out in the rule, including an annual report to the Office of the General Counsel and a combined fee no higher than the client would otherwise pay. The Atlanta Bar Association has run its Lawyer Referral and Information Service since 1955 and says it met the American Bar Association’s standards for lawyer referral programs in 2003 ([Atlanta Bar LRIS history](${ATL_LRIS})).
- **Reciprocal referrals.** Allowed if not exclusive and the client is told about the arrangement.

Before you buy leads, read the vendor’s public pages as a prospective client would. Phrases like “we match you with the best attorney for your case” are the warning sign comment [5] describes.

## Does the 30-day rule affect a law firm website?

The website itself, no. Comment [1] to Rule 7.3 says a communication is not a solicitation if it is “directed to the general public, such as through a billboard, an Internet banner advertisement, a website or television commercial,” or if it responds to a request for information or is generated automatically in response to electronic searches.

What the site sets in motion can be covered, though. Rule 7.3(c)(3) prohibits a solicitation when “the written communication concerns an action for personal injury or wrongful death or otherwise relates to an accident or disaster involving the person to whom the communication is addressed or a relative of that person, unless the accident or disaster occurred more than 30 days prior to the communication.” Rule 7.3(c)(4) adds a separate bar when the lawyer knows or reasonably should know the person’s physical, emotional or mental state prevents reasonable judgment.

How that plays out for a personal injury firm in Atlanta:

1. **Form submissions are requests.** When someone fills in your “free case review” form, your reply responds to their request for information. Answer promptly.
2. **Don’t build lists from crash reports.** Emailing or texting people you learned were in a wreck last week, who never contacted you, is the written solicitation paragraph (c)(3) addresses.
3. **Separate nurture emails from cold outreach.** Automated sequences should go only to people who asked to hear from you, and stop the moment they ask.
4. **Keep live contact off the table.** Rule 7.3(b) bars live person-to-person solicitation for pecuniary gain, and comment [2] defines that as in-person, live phone and real-time visual or audio contact. Text messages and chat are treated as written communications that can be ignored, but they remain subject to paragraph (c).

Comment [6] to Rule 7.3 also says live contact is ordinarily not appropriate for people who may be especially vulnerable, naming “the elderly, those whose first language is not English, or the disabled.” For a firm marketing to Atlanta’s immigrant communities, that is a reason to invest in good translated pages people can read in their own time, rather than outreach calls.

![A large white PEACHTREE sign mounted on a highway overpass in Atlanta, with a green Spring Street and West Peachtree exit sign and traffic below](https://images.unsplash.com/photo-1745206890921-eaea8079cf3d?auto=format&fit=crop&w=1200&q=75)

## Firm names, domains and shared office space

Comment [5] to Rule 7.1 treats firm names, letterhead and “a distinctive website address, social media username or comparable professional designation” as communications that must not mislead. A name is misleading if it implies a connection with a government agency, with a lawyer not associated with the firm, with a nonlawyer, or with a public or charitable legal services organization. The comment also gives a direct warning about geography: a trade name such as “Springfield Legal Clinic” may need “an express statement explaining that it is not a public legal aid organization.”

That example maps neatly onto Atlanta. Names and domains built from “Atlanta Legal Help,” “Georgia Justice Center” or “Fulton Legal Clinic” can read like public services. If you use one, add the clarifying statement in the footer and on the about page, or choose a name that can’t be confused.

Two more comments come up often:

- **Shared suites.** Comment [7] bars lawyers from holding themselves out as practicing together in one firm when they are not a firm. Lawyers sharing space in a Buckhead or Downtown office building shouldn’t share a single site with one “our team” page unless they are, in fact, one firm.
- **Offices in more than one state.** Comment [6] lets a firm use the same name in each jurisdiction. Listing each lawyer’s bar admissions on their profile is still good practice, and it answers the first question a visitor from Alabama or Tennessee will have.

## How do people across metro Atlanta search for a lawyer?

Start with the courts, because clients often know their case number or courthouse before they know a lawyer. The Superior Court of Fulton County describes itself as a trial court of general jurisdiction handling civil and criminal actions, and its site sends the public to divorce and custody paperwork, temporary protective orders, interpreter requests, case records and livestreamed proceedings ([Superior Court of Fulton County](${FULTON_SUP})). Those are the moments when people go looking for a lawyer, and each is the starting point for a useful page:

- A family law firm can write a page explaining how a divorce or custody case moves through Fulton Superior, from filing to a first hearing, in the terms the court itself uses.
- A domestic violence practice can explain the temporary protective order process and what happens at the follow-up hearing.
- A criminal defense firm can describe what happens after an arrest in Fulton County and what a first appearance involves.

Write those pages from experience in those courtrooms. Google’s spam policies describe doorway pages, pages made for similar searches that send everyone to the same place, as a violation ([Google spam policies](${SPAM})). One genuinely useful Fulton County page beats ten thin pages that swap in DeKalb, Cobb and Clayton.

Language is where Atlanta firms most often misjudge their market. The Census Bureau’s QuickFacts reports that 12.2% of Atlanta city residents age 5 and over speak a language other than English at home and 9.0% were born abroad ([QuickFacts, Atlanta](${CENSUS_ATL})). In Gwinnett County the figures are 38.1% and 28.4%, with 25.5% of residents Hispanic or Latino and 15.7% Asian ([QuickFacts, Gwinnett](${CENSUS_GWN})). A firm with offices in Lawrenceville or Duluth and a Spanish-, Korean- or Vietnamese-speaking lawyer has a real reason for pages in that language. A Midtown business litigation boutique may not. Comment [1] to Rule 7.2 lists “a lawyer’s foreign language ability” as information you may advertise; just make sure the person named can actually handle a consultation in that language.

## How should an Atlanta firm set up its Google Business Profile?

Google weighs relevance, distance and prominence for local results ([how Google ranks local results](${LOCAL_RANKING})), and distance matters in a metro where a client in Marietta may never drive to Decatur. Google’s guidelines for representing a business ([Business Profile guidelines](${GBP_GUIDELINES})) set the boundaries:

- **A profile only for a staffed location.** Each real office where clients can meet a lawyer during stated hours can have one. Virtual offices and mailboxes don’t qualify.
- **Practitioners, with limits.** A public-facing lawyer can have an individual profile, but not one profile per practice area.
- **No keywords in the name.** Use the firm’s real name, not “Firm Name Atlanta Car Accident Lawyers.”

Point each profile to the matching office page, keep the name, address and phone number identical on both, and ask satisfied clients for reviews the way Google allows ([asking for reviews the right way](/blog/ask-for-google-reviews-the-right-way)).

![A smiling attorney in a dark suit and red tie talking with a colleague across a wooden conference table in an office with exposed brick walls](https://images.unsplash.com/photo-1551836022-aadb801c60ae?auto=format&fit=crop&w=1200&q=75)

## Which pages should an Atlanta law firm website have?

A focused set of pages does more than a sprawling one:

1. **Home page** that states who you represent, in what kinds of matters and in which counties, with a click-to-call number visible on a phone.
2. **A page per practice area,** written around Georgia procedure and the questions clients ask in the first meeting. Our checklist on [writing pages AI answers can quote](/blog/write-pages-ai-answers-can-quote) helps here.
3. **Attorney profiles** with bar admissions, courts, languages, and any specialty claim backed by facts or a named certifying body.
4. **Office pages** for each staffed location, with hours, parking and transit directions.
5. **A fees page** that gives prices or explains how you charge.
6. **Results and testimonials** with context and a qualifier right underneath.
7. **A consultation form** that collects only what you need to call back and check for conflicts.
8. **A disclaimer page** naming the responsible lawyer, with contact details, and explaining that submitting the form doesn’t create an attorney-client relationship.

## Atlanta law firm website checklist

- Footer on every page, landing pages included, shows the firm name and contact information (Rule 7.2(d)).
- Disclaimer and footer text rewritten for the rules effective March 1, 2026.
- Every “specialist” or “specializes in” is supported by facts; certifications name the certifying body.
- Results show context and a nearby qualifier; no unprovable comparisons.
- No fake urgency that makes visitors think they must act.
- Directories, lead generators and referral services you pay meet Rule 7.2(b) and comment [5].
- Follow-up emails and texts go only to people who contacted you; no written outreach to accident victims within 30 days.
- Trade names and domains can’t be mistaken for public legal aid.
- Language claims match a real lawyer’s ability.
- Court pages are written from real experience, not swapped place names.
- One Business Profile per staffed office, with the real firm name.
- Structured data describes only what visitors can see on the page ([structured data guidelines](${SD_GUIDELINES})), and pages load quickly on a phone ([is your website fast enough](/blog/is-your-website-fast-enough)).

## How SaySites builds an Atlanta law firm website

A SaySites law firm site starts with this page plan: a page per practice area, a profile per attorney, a page per office, and a consultation form on every page whose intake questions include the other party’s name for a conflict check. The firm is described to search engines as a LegalService, each attorney as a Person and each practice area as a Service, and pages must pass a 95+ speed check before they go live. A site can be written in English or in Spanish. To make a change you type it in plain words, such as “add our phone number and Peachtree Street address to the footer of the car accident landing page,” and the change waits as a draft until you approve it. Results, reviews and credentials come only from you; nothing is made up.

The Law Firm Starter plan is $79 a month ([websites for law firms](/websites-for/law-firms), [see pricing](/pricing)). If your current site still carries a pre-2026 disclaimer, [request a free redesign](/redesign) and see your own pages rebuilt before paying anything, or [start a 7-day free trial](/signup) and build it yourself. For more on what top sites do, see [what we found testing 105 top-ranking law firm websites](/blog/we-tested-top-ranking-law-firm-websites) and [Google AI Overviews for law firms](/blog/google-ai-overviews-for-law-firms).`,
    faq: [
      { q: 'When did Georgia’s current lawyer advertising rules take effect?', a: 'The Supreme Court of Georgia amended Rules 7.1, 7.2 and 7.3 of the Georgia Rules of Professional Conduct by order dated November 18, 2025, and the changes took effect on March 1, 2026. Rules 7.4 and 7.5 are now reserved. Website disclaimers written before March 2026 should be checked against the current text in the State Bar handbook.' },
      { q: 'What contact details does a Georgia law firm website need?', a: 'Rule 7.2(d) requires the name and contact information of at least one lawyer or law firm responsible for the content. Comment [11] says contact information includes a website address, phone number, email address or physical office location. A site footer with the firm name, phone and address on every page, including ad landing pages, covers it.' },
      { q: 'Can a Georgia lawyer advertise as a specialist?', a: 'Yes, if it is true and not misleading. Rule 7.2(c) allows a lawyer who is a specialist by experience, specialized training or education, or who is certified by a recognized and bona fide professional entity, to say so. The claim is still judged under Rule 7.1, so back it with facts on the page and name any certifying body.' },
      { q: 'What is Georgia’s 30-day rule for accident cases?', a: 'Rule 7.3(c)(3) bars a written solicitation about personal injury, wrongful death or an accident or disaster involving the recipient or a relative unless the event happened more than 30 days earlier. It does not cover your website or replies to people who contacted you, but it does cover cold emails, letters and texts to accident victims.' },
      { q: 'Can an Atlanta law firm pay for leads or directory listings?', a: 'Yes, within limits. Rule 7.2 allows paying for advertising, including online directories, and comment [5] allows paying lead generators that do not recommend the lawyer, take payments consistent with Rules 1.5(f) and 5.4, and make no misleading claims. A service that implies it analyzed the person’s case to choose a lawyer crosses the line.' },
      { q: 'Should an Atlanta law firm website be in Spanish or another language?', a: 'It depends on where the firm practices. Census QuickFacts reports 12.2% of Atlanta city residents age 5 and over speak a language other than English at home, compared with 38.1% in Gwinnett County. If a lawyer at the firm consults in another language and serves those communities, translated pages reviewed by a fluent speaker make sense.' },
      { q: 'What does a SaySites law firm website cost?', a: 'The Law Firm Starter plan is $79 a month and begins with a 7-day free trial. It includes practice area pages, attorney profiles, office pages, a consultation form with a conflict-check question, LegalService structured data and hosting. You can also ask for a free redesign to see your current site rebuilt before you decide.' },
    ],
    about: ['Georgia Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Atlanta, Georgia'],
    published: '2026-10-19',
    status: 'published',
  },
  {
    slug: 'seattle-plumber-website-design',
    title: 'Seattle Plumber Websites: Washington License Rules',
    description: 'Build a Seattle plumbing website around Washington’s plumbing contractor license, side sewer permits now run by SPU, King County permits and local search.',
    kind: 'guide',
    summary: [
      'Since July 1, 2021, Washington requires a plumbing contractor license under RCW 18.106 to advertise, bid or contract plumbing work; general contractors can’t advertise plumbing.',
      'Each day a business advertises plumbing work in violation of the chapter is a separate infraction, so an unlicensed website keeps counting.',
      'Seattle Public Utilities took over side sewer permits on October 1, 2025; a sanitary side sewer repair permit generally costs $280 and is processed by the next business day.',
      'Plumbing inside the building is permitted by Public Health – Seattle & King County, and only owners doing their own work or licensed plumbing contractors may buy those permits.',
      'Most Seattle homes are rented (43.7% are owner-occupied), so a site has to speak to tenants, landlords and property managers as well as owners.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1600&q=75', alt: 'The Space Needle and downtown Seattle towers lit by low sun, with snow-capped Mount Rainier on the horizon under a deep blue sky' },
    body: `A Seattle plumber’s website does three jobs at once. It proves the business is allowed to advertise plumbing in Washington, which since July 1, 2021 means holding a plumbing contractor license under chapter 18.106 RCW. It explains the permits a Seattle job really involves, from side sewer permits issued by Seattle Public Utilities to inside-the-house plumbing permits from Public Health – Seattle & King County. And it gets the phone to ring from the right people, in a city where more households rent than own and where a cracked side sewer is the owner’s problem, not the city’s. Get those three right and the design questions mostly answer themselves.

This guide walks through each one with links to the state law, the city and the county, then gives a page plan and a launch checklist. Rules change, so check the linked sources before you rely on any detail; Labor & Industries (L&I) and the permitting agencies have the final word.

## What license does a Seattle plumbing company need to advertise?

Washington rewrote its plumbing laws in 2020. According to L&I, beginning July 1, 2021 the old “specialty plumbing” registration stopped being valid, all plumbing contract work must be done by a Licensed Plumbing Contractor under chapter 18.106 RCW, and “general contractors cannot offer, advertise, and/or bid on projects that require plumbing work” ([L&I plumbing contractor licensing](${LNI_PC})).

The statute itself is direct. [RCW 18.106.400](${RCW_106_400}) makes it unlawful, as of July 1, 2021, “to advertise, offer to do work, submit a bid, or perform any work” under the chapter without a plumbing contractor license. The license lasts 24 months. To get one, L&I says the business must designate a certified plumber as its dedicated plumber, carry a $6,000 continuous plumbing contractor bond and hold general liability insurance.

Two details matter for marketing:

- **The website is advertising.** Under [RCW 18.106.020](${RCW_106_020}), each day a person or business “advertises, offers to do work, submits a bid, or performs any work in the trade of plumbing” in violation of the chapter is a separate infraction. L&I’s FAQ says penalties for performing, bidding or advertising without the license range from $500 to $5,000 ([L&I licensing FAQs](${LNI_FAQ})). A site that stays up while a license is lapsed or suspended keeps advertising every day.
- **Certified plumbers who moonlight still need the license.** [WAC 296-400A-430](${WAC_430}) says anyone who advertises or does plumbing work must be a licensed plumbing contractor “or an employee of such a licensed plumbing contractor, with wages as their sole compensation.” A journey-level plumber with a side website offering weekend repairs needs a contractor license of their own.

## Should the license number be on the website?

The plumbing chapter doesn’t spell out a website format, but showing the number is the easiest trust signal you have. L&I lists every licensed business in its [Verify a Contractor, Tradesperson, or Business tool](${LNI_VERIFY}), and careful customers, property managers and general contractors check it. Put the license number in the footer of every page and on your about page, next to the exact business name on the license, so anyone can match the two in seconds.

If your company is also registered as a general contractor under chapter 18.27 RCW for non-plumbing work like cabinets or tile, which L&I says licensed plumbing contractors may choose to do, that registration brings its own advertising rules. [RCW 18.27.100](${RCW_27_100}) requires that advertising showing a registered contractor’s name or address show the name as registered and the current registration number, forbids using a false or expired number, and says a contractor shall not advertise that it is “bonded and insured” because of the bond and insurance the chapter requires. L&I’s FAQ notes the two registrations carry different numbers, so make sure the right number sits next to the right kind of work.

What to avoid on the page:

1. **Services outside your certificates.** [RCW 18.106.020](${RCW_106_020}) limits plumbing to people holding the right certificate, and medical gas piping requires a journey-level certificate plus a medical gas piping installer endorsement. List only work your team is certified to do.
2. **A trade name that isn’t on the license.** If customers know you as “Rainier Drain Pros” but the license says “R. Alvarez Plumbing LLC,” say both, clearly.
3. **Stale numbers.** When the license renews or the business changes structure, update every page the same week.

![A person with an umbrella crossing a rain-soaked Seattle street at night, streetlights reflecting off the wet pavement between apartment buildings](https://images.unsplash.com/photo-1742183635084-64c141301176?auto=format&fit=crop&w=1200&q=75)

## Who issues plumbing and side sewer permits in Seattle?

Two different agencies, which confuses customers and gives you something genuinely useful to explain.

**Inside the building: Public Health – Seattle & King County.** The city’s utility notes that piping inside a building is considered plumbing and is regulated, permitted and inspected by Public Health – Seattle & King County ([SPU side sewer permits](${SPU_SS})). The county’s Plumbing & Gas Program takes applications, plan review submissions and inspection requests through its Public Health Permit Center ([county permits page](${KC_PERMITS})). Its guidance for homeowners adds that if you pay someone to do plumbing work, the installer must be a certified plumber working for a properly licensed contractor, and that plumbing permits can be bought only by owners doing their own work or by licensed plumbing contractors, citing RCW 18.106.440 ([King County hiring guidance](${KC_HIRE})). Within the City of Seattle, the same page says a gas pipe installer must be the property owner or hold a Seattle Gas Piping Mechanic License.

**Outside the building: Seattle Public Utilities.** Side sewer work moved from the Seattle Department of Construction and Inspections to Seattle Public Utilities (SPU) on October 1, 2025. The city’s announcement says SPU now reviews plans, issues side sewer permits and inspects the work, that core tap fees are now paid up front on the permit invoice, and that SPU planned to reinstate its Registered Side Sewer Contractor Program in 2026 ([City of Seattle announcement](${SEA_SS_MOVE})). Check SPU’s page for the program’s current status before you describe it on your site.

SPU’s side sewer page gives the facts customers ask about most ([SPU side sewer permits](${SPU_SS})):

- **Who owns the pipe.** The entire side sewer, all the way to the connection to the public main, “is owned and maintained by the property owner.”
- **When a permit is needed.** To connect, repair, alter, add to, abandon or cap a side sewer, among other things. A repair permit is required any time a pipe or external fixture such as a cleanout needs repair or replacement.
- **What it costs.** A sanitary repair permit on private property generally costs $280 and a drainage repair permit generally $375, each including one to two inspections; fees vary by scope.
- **How long it takes.** SPU processes repair and addition or alteration permits by the end of the next business day after it receives the application.
- **Work in the street.** A separate permit from the Seattle Department of Transportation is required for work in the public right-of-way ([SDOT side sewer FAQs](${SDOT_SS})).
- **Before digging.** SPU recommends calling 811 two business days ahead to have utilities marked.

A page titled something like “Side sewer repair in Seattle: who owns it, permits and timelines” built from those facts, plus your own experience of what a typical repair involves, is the kind of page a worried homeowner actually reads to the end. It also shows you know the process, which is the point.

## Who is actually searching for a plumber in Seattle?

The Census Bureau’s QuickFacts for Seattle reports an owner-occupied housing rate of 43.7% for 2020 to 2024, a median owner-occupied home value of $938,600, and that 23.7% of residents age 5 and over speak a language other than English at home ([QuickFacts, Seattle](${CENSUS_SEA})). Each of those numbers shapes the site:

- **Renters call too, but they can’t approve the job.** With most households renting, a large share of calls come from tenants with a leak and no authority to sign off on the repair. A short page for tenants (what to tell your landlord, what to do while you wait) and a separate page for landlords and property managers (how you handle access, approvals and billing) keeps both kinds of calls productive.
- **Owners of expensive homes want proof.** Homeowners deciding on a side sewer replacement or a repipe want to see the license, the permit process, photos of real jobs and clear explanations before they call.
- **Language matters in some neighborhoods.** If someone on your team can talk a customer through a job in Spanish, Vietnamese, Chinese or another language, say so on the home page and in your Google Business Profile. Only promise a language someone on staff actually speaks, and if you add translated pages, follow Google’s guidance for [localized versions of pages](${HREFLANG}).

## How should a Seattle plumber set up Google Business Profile?

Most plumbing companies serve customers at their homes and don’t take walk-ins, which makes them service-area businesses in Google’s terms. Google’s guidance says to set the area you serve and hide the street address if customers don’t visit you there ([service-area businesses](${SERVICE_AREAS})). Its guidelines also bar keywords stuffed into the business name ([Business Profile guidelines](${GBP_GUIDELINES})): “Alvarez Plumbing” stays “Alvarez Plumbing,” not “Alvarez Plumbing Seattle Emergency Drain Cleaning.”

Google ranks local results on relevance, distance and prominence ([how local ranking works](${LOCAL_RANKING})). You can’t change where a caller is, but you can make relevance obvious by naming the services you really offer and the neighborhoods and nearby cities you really cover, both on the profile and on your website. Ask every satisfied customer for a review, never offer anything in return, and reply to reviews in your own words ([tips on reviews](${REVIEW_TIPS})). Our guide on [service-area businesses on Google](/blog/service-area-business-google) covers the setup step by step.

![A plumber in navy overalls working on exposed pipes inside the wall of a modern gray-tiled bathroom, with a blue toolbox on the toilet lid](https://images.unsplash.com/photo-1749532125405-70950966b0e5?auto=format&fit=crop&w=1200&q=75)

## What pages should a Seattle plumbing website have?

Think of each page as an answer to a call you already get:

1. **Home page.** What you do, where, your hours, a tap-to-call number visible on a phone, and your L&I license number in the footer.
2. **Emergency service page,** if you offer it: what counts as an emergency, your real response window and how after-hours pricing works. Never promise a response time you can’t meet.
3. **One page per core service.** Drain cleaning, water heaters, leak detection, repiping, fixtures, side sewer repair. Explain what the work involves, which permit applies (county plumbing permit or SPU side sewer permit), and what affects the price.
4. **Side sewer guide,** built on SPU’s rules above.
5. **Service area page** listing the neighborhoods and nearby cities you truly serve, with something specific to say about each one if you can, such as older housing stock you often work on. A page per neighborhood with nothing but the name swapped is the doorway pattern Google’s [spam policies](${SPAM}) warn against.
6. **Landlords and property managers page** covering access, approvals, invoicing and multifamily work.
7. **About and licensing page** with the business name exactly as licensed, the license number, the designated plumber and how to verify both on L&I’s site.
8. **Reviews and recent jobs,** with real photos and customers’ words unedited.
9. **Job request form** asking only what you need to call back: how urgent, the ZIP code, and whether they own or rent.

For more on the first screen visitors see, read [what to put on your home page](/blog/what-to-put-on-your-home-page).

## Seattle plumbing website launch checklist

- Business name on the site matches the name on the L&I plumbing contractor license.
- License number in the footer of every page and on the about page.
- If also registered under chapter 18.27, that registration number appears where required, with no “bonded and insured” claim based on the required bond.
- Services listed are within your team’s certificates and endorsements.
- Side sewer content reflects SPU as the permitting agency since October 1, 2025.
- Inside-plumbing content points to Public Health – Seattle & King County permits.
- Separate paths for owners, tenants and landlords.
- Google Business Profile set up as a service-area business with the real name.
- Service area page has real, specific content.
- Pages load fast on a phone ([Core Web Vitals](${WEB_VITALS})); see [is your website fast enough](/blog/is-your-website-fast-enough).
- Structured data matches what’s on the page ([structured data guidelines](${SD_GUIDELINES})).

![Close-up of a plumber’s hands, one wearing a steel wristwatch, tightening a white drain fitting under a sink lit in blue](https://images.unsplash.com/photo-1676210134190-3f2c0d5cf58d?auto=format&fit=crop&w=1200&q=75)

## How SaySites helps Seattle plumbers

SaySites gives a plumbing company the structure above without a long build. A new site comes with a page for each service, a service-area page, a tap-to-call button and a job request form on every page, whose questions ask how soon the customer needs you, the ZIP code of the job and whether they own or rent. The business is described to search engines as a Plumber, and each page has to pass a 95+ speed check before it goes live. Requests land in a leads pipeline where you call, email, add notes and follow each one to a won job, and you can invite office staff to work the leads without touching the rest of the site. You edit by saying what you want in plain words, for example “add our L&I plumbing contractor license number to the footer” or “write a page about side sewer repair permits from SPU,” and each change appears as a draft for you to approve. Licenses, photos and reviews come only from you.

The Site plan is $15 a month with hosting included ([websites for plumbers](/websites-for/plumbers), [pricing](/pricing)). To see your current site rebuilt before you decide, [ask for a free redesign](/redesign), or [start a 7-day free trial](/signup) and have it live this week. Plumbers in other cities can compare notes with our [Chicago plumber website guide](/blog/chicago-plumber-website-design), and anyone curious how local results work can read [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).`,
    faq: [
      { q: 'Do Seattle plumbers need a contractor license to advertise?', a: 'Yes. Since July 1, 2021, RCW 18.106.400 makes it unlawful to advertise, offer, bid or perform plumbing work in Washington without a plumbing contractor license from Labor & Industries. General contractors can no longer advertise plumbing work. Each day of advertising in violation of the chapter counts as a separate infraction, and L&I lists penalties from $500 to $5,000.' },
      { q: 'Should my Washington plumbing license number be on my website?', a: 'It is the simplest way to show customers you are licensed. L&I’s Verify a Contractor tool lets anyone look up the business, so put the license number and exact licensed name in the footer and on your about page. If you are also registered under RCW 18.27 for other work, that law requires the registration number on advertising.' },
      { q: 'Who issues side sewer permits in Seattle?', a: 'Seattle Public Utilities has issued and inspected side sewer permits since October 1, 2025, when the work moved over from the Seattle Department of Construction and Inspections. Applications still go through the Seattle Services Portal. Work in the public right-of-way also needs a separate permit from the Seattle Department of Transportation.' },
      { q: 'How much is a side sewer repair permit in Seattle?', a: 'SPU says a sanitary side sewer repair permit for work on private property generally costs $280 and a drainage repair permit generally costs $375, each including one to two inspections. Fees vary with the scope of work, and SPU processes repair permits by the end of the next business day after receiving the application.' },
      { q: 'Who is responsible for a broken side sewer in Seattle?', a: 'The property owner. Seattle Public Utilities says the entire side sewer, all the way to the connection to the public main, is owned and maintained by the property owner. That is why a clear side sewer page on a plumber’s website helps: homeowners often learn this only when something goes wrong.' },
      { q: 'Who permits plumbing work inside a Seattle home?', a: 'Public Health – Seattle & King County regulates, permits and inspects plumbing inside buildings through its Plumbing & Gas Program and online Permit Center. The county says plumbing permits can be bought by owners doing their own work or by licensed plumbing contractors. Gas piping in Seattle needs the owner or a Seattle Gas Piping Mechanic License holder.' },
      { q: 'What does a SaySites plumbing website cost?', a: 'The Site plan is $15 a month, or $150 a year, with hosting included and a 7-day free trial to start. It includes service pages, a service-area page, a job request form with urgency, ZIP code and own-or-rent questions, Plumber structured data and a leads pipeline. You can also request a free redesign of your current site first.' },
    ],
    about: ['Plumbing contractor licensing in Washington', 'Plumber websites', 'Side sewer permits', 'Seattle, Washington'],
    published: '2026-10-19',
    status: 'published',
  },
  {
    slug: 'boston-law-firm-website-design',
    title: 'Boston Law Firm Website Design: Massachusetts Rules',
    description: 'Build a Boston law firm website under Massachusetts Rules 7.1 to 7.3: certification wording, lead generators, Suffolk County courts and multilingual clients.',
    kind: 'guide',
    summary: [
      'Massachusetts rewrote its lawyer advertising rules in 2022: the current Rules 7.1, 7.2 and 7.3 were adopted on July 13 and took effect on October 1, 2022.',
      'Every advertising page must name at least one lawyer or law firm responsible for its content (Rule 7.2(d)).',
      '“Focuses on” is fine if true; “certified” needs an approved or ABA-accredited certifier, or a statement that the certifier is a private, unregulated organization, and the certifier’s name every time.',
      'A website is not a solicitation, but lead generators are allowed only if they don’t recommend you and their own claims meet Rule 7.1.',
      'Boston clients search by court and neighborhood: eight Boston Municipal Court divisions, Suffolk Superior, Suffolk Probate and Family, and the Housing Court’s Boston session.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1565127803082-69dd82351360?auto=format&fit=crop&w=1600&q=75', alt: 'The Boston skyline rising beyond the Charles River on a clear day, with dozens of small sailboats on the water and trees along the bank' },
    body: `A Boston law firm website has to follow the Massachusetts Rules of Professional Conduct, and since October 1, 2022 the parts that matter for a website fit on one page. Say nothing false or misleading about the firm (Rule 7.1). Name at least one lawyer or firm responsible for each advertising page (Rule 7.2(d)). Use the word “certified” only with a qualifying certifier, named every time, or with a statement that the certifier is private and unregulated (Rule 7.2(c)). Don’t pay anyone to recommend you, and check that any lead generator you pay stays within the limits in comment [5] to Rule 7.2. Then build the site around the way Bostonians actually look for a lawyer: by the courthouse their case is in, by the neighborhood they live in, and, in about a third of households, in a language other than English.

This guide takes each of those in turn, quoting the Supreme Judicial Court’s rule text as published on Mass.gov, and finishes with a page plan and a checklist for a Boston firm. It’s practical guidance for building a website, not an ethics opinion; the rules themselves and the Board of Bar Overseers have the final word.

## What do the Massachusetts rules say about law firm websites?

Three rules do the work. The Supreme Judicial Court adopted the current versions of Rules 7.1, 7.2 and 7.3 on July 13, 2022, effective October 1, 2022, as shown at the foot of each rule on Mass.gov ([Rule 7.1](${MA_71}), [Rule 7.2](${MA_72}), [Rule 7.3](${MA_73})). If your site went up before late 2022 and your footer or disclaimer page quotes rule language, check it against the current text.

Rule 7.1 is the general standard: “A lawyer shall not make a false or misleading communication about the lawyer or the lawyer’s services.” A statement is misleading if it misstates a material fact or law, or leaves out a fact needed to keep the whole statement from misleading. The comments add that a statement can be literally true and still mislead, for instance when it leads a reader to a conclusion about the lawyer that has no factual basis.

Rule 7.2(a) is permissive: “A lawyer may communicate information regarding the lawyer’s services through any media.” A website, a Google Business Profile, a YouTube channel and a newsletter are all fine. Comment [1] lists what that information can include, among other things “the kinds of services the lawyer will undertake,” “the basis on which the lawyer’s fees are determined, including prices for specific services and payment and credit arrangements,” and “a lawyer’s foreign language ability.”

Rule 7.2(d) is the one item every advertising page needs: “Any communication made under this Rule must include the name of at least one lawyer or law firm responsible for its content.” On a website the simplest way to meet it on every page, including landing pages people reach straight from Google, is a footer with the firm’s full name. Many firms also name the responsible attorney on the disclaimer page, which costs nothing and answers the question for good.

## Can a Boston lawyer call herself a specialist or “certified”?

Massachusetts separates describing a practice from claiming a credential.

Describing is allowed. Rule 7.2(c) permits a lawyer to say that she focuses on or specializes in an area of law, as long as the statement isn’t false or misleading. Comment [9] adds a catch that matters for marketing copy: a lawyer who holds herself out as a specialist is held to the standard of a specialist in that field. Write “our practice focuses on employment law” only if that is where most of your work actually goes.

Claiming certification is narrower. A lawyer may not state or imply certification as a specialist unless one of two things is true:

1. She “has been certified as a specialist by an organization that has been approved by an appropriate State authority or that has been accredited by the American Bar Association”; or
2. The communication “states that the certifying organization is a private organization, whose standards for certification are not regulated by a state authority or the American Bar Association.”

In both cases the certifying organization must be named in the communication itself. On a website that means the full name of the certifying body sits next to the word “certified” on the lawyer’s bio, and the qualifying statement from the second path, if it applies, sits right there too, not three clicks away. Watch the places where a credential slips in without context: page titles, image alt text, schema markup and the short description Google may show under your link ([how Google builds snippets](${SNIPPETS})). A title like “Certified Boston Estate Planning Attorneys” on the firm’s home page implies every lawyer holds a certification.

![The gold-domed Massachusetts State House rising above its columned brick facade against a clear blue sky](https://images.unsplash.com/photo-1723853310614-d2da3634806a?auto=format&fit=crop&w=1200&q=75)

## How should a Boston firm show results, reviews and fees?

The test comes from comment [3] to Rule 7.1. A truthful report of results can mislead if it is presented so that a reader expects similar results for themselves without regard to the facts of their own case, and an unverifiable comparison of one lawyer’s services or fees with another’s can mislead in the same way. The comment also notes that “the inclusion of an appropriate disclaimer or qualifying language may preclude a finding” that a statement is misleading.

For a results page that holds up, a few habits help:

- **Give context, not just a number.** Name the case type, the court and what was at stake. A $1.2 million figure means little without knowing whether it was a verdict or a settlement and what the injuries were.
- **Put the qualifier next to the results.** A line such as “Every case is different; these results do not predict the outcome of yours” belongs under the list, in normal-sized type, not only on a disclaimer page.
- **Don’t compare yourself to unnamed rivals.** “Boston’s most aggressive DUI defense” or “lower fees than other firms” are the kind of claims comment [3] warns about unless you can prove them.
- **Quote reviews as written.** Show real clients’ words without editing them, and never post or pay for reviews. Google’s own policy forbids fake engagement on Maps ([Maps user contributed content policy](${MAPS_POLICY})), and the steps in [how to ask for Google reviews without breaking the rules](/blog/ask-for-google-reviews-the-right-way) apply to law firms as well.

Fees are an opportunity more than a risk. Comment [1] to Rule 7.2 expressly lists prices for specific services and payment arrangements as information a lawyer may share. A Boston firm that posts a flat fee for an uncontested divorce, a simple will package or a first-offense OUI consultation answers the question many visitors are too uncomfortable to ask on the phone. Keep the price page accurate: say what the fee covers, what it doesn’t (filing fees, expert costs), and when it was last updated.

## What can a Massachusetts firm pay for: ads, directories and lead generators?

Rule 7.2(b) starts with a prohibition: a lawyer generally may not give anything of value to a person for recommending the lawyer’s services. The exceptions are what make online marketing possible. A lawyer may pay for permitted advertising, pay the usual charges of a legal service plan, a lawyer referral service or a qualified legal assistance organization, pay for a law practice under Rule 1.17, enter a disclosed, non-exclusive reciprocal referral arrangement with another lawyer or professional, and give nominal gifts that aren’t tied to referrals.

Comment [3] spells out what counts as advertising cost, including online directory listings, banner ads, sponsorships and domain registrations. It also confirms that a lawyer may pay employees, agencies and vendors for marketing work, website design included.

Lead generators get their own paragraph. Under comment [5], a lawyer may pay one only if:

- “the lead generator does not recommend the lawyer”;
- “any payment to the lead generator is consistent with Rules 1.5(e)” (fee division) “and 5.4 (professional independence of the lawyer)”; and
- “the lead generator’s communications are consistent with Rule 7.1.”

The same comment says a lawyer must not pay a lead generator that “states, implies, or creates a reasonable impression that it is recommending the lawyer,” that suggests it is making the referral without payment from the lawyer, or that “has analyzed a person’s legal problems when determining which lawyer should receive the referral.” Before signing with any pay-per-lead or “matched attorney” service, read its consumer-facing pages as if you were the client. If they say “we’ll find the right Boston lawyer for your case,” that is the kind of wording the comment describes.

## Is a website, live chat or follow-up email a solicitation?

Rule 7.3 defines a solicitation as a communication initiated by or on behalf of a lawyer or firm that is “directed to a specific person the lawyer knows or reasonably should know needs legal services” in a particular matter and offers to provide them. Comment [1] puts general advertising outside that definition, naming “a billboard, an Internet banner advertisement, a website” among its examples, and also excludes responses to a person’s request for information and automatically generated responses to electronic searches.

So the website itself isn’t a solicitation, and neither is a reply to someone who filled in your consultation form. The rule bites on live person-to-person contact. Rule 7.3(b) restricts solicitation by “live person-to-person contact” when a significant motive is the lawyer’s pecuniary gain, and comment [2] describes that as in-person, face-to-face, live telephone and other real-time visual or auditory contact where the person has no time to reflect. Comment [2] treats text messages and other written communications that a person can easily disregard differently. Paragraph (c) adds limits that apply even when (b) doesn’t: no solicitation of someone who has said they don’t want it, and none that involves coercion, duress or harassment.

In practice, for a Boston firm’s site:

1. A chat window the visitor opens is a response to their request. Have it collect contact details and a short description, and keep anyone answering it from pressing for a decision.
2. Automated follow-up emails after a form is submitted are fine; stop them as soon as the person asks.
3. Don’t buy lists of people who were just arrested or injured and call them. That is exactly what Rule 7.3(b) addresses.

![Boston’s Old State House, a red brick building with a white clock tower, framed by modern office towers in the Financial District](https://images.unsplash.com/photo-1623607769583-f95269221eaf?auto=format&fit=crop&w=1200&q=75)

## Firm names, shared offices and multistate firms

Comment [5] to Rule 7.1 covers firm names and designations. A firm may practice under a trade name if it isn’t false or misleading, but a name is misleading if it implies a connection with a government agency, with a lawyer not associated with the firm, with a nonlawyer, or with a public or charitable legal services organization. Comment [9] points to Supreme Judicial Court Rule 3:06 for the extra limits on names of professional corporations, LLCs and LLPs. A domain name is part of your designation too, so “bostonlegalaid” style addresses for a private firm are a bad idea.

Two more comments come up often around Boston:

- **Office sharing.** Comment [7] says lawyers “may not imply or hold themselves out as practicing together in one firm when they are not a firm.” Solo lawyers who share a suite in the Financial District or Back Bay shouldn’t share a website that reads like one firm, a joint name like “Smith & Lee,” or one “Our attorneys” page, unless they effectively disclaim joint responsibility.
- **Offices in more than one state.** Some Boston firms also have lawyers admitted in New Hampshire, Rhode Island or New York. Comment [6] allows the same firm name in every jurisdiction but requires the firm to show which lawyers are not licensed in the jurisdiction where an office is located. On the website, list each lawyer’s bar admissions on their profile and on each office page.

## How do people in Boston search for a lawyer?

Boston’s courts give a firm a natural structure for its pages, because clients often know which courthouse their case is in before they know which lawyer they want. According to the Massachusetts Trial Court, the courts serving Boston include eight Boston Municipal Court divisions (Brighton, Central, Charlestown, Dorchester, East Boston, Roxbury, South Boston and West Roxbury), the Boston session of the Eastern Housing Court, the Suffolk County Juvenile Court, the Land Court, Suffolk Probate and Family Court and Suffolk Superior Court, with the Supreme Judicial Court and Appeals Court at the John Adams Courthouse ([courts serving Boston](${MA_COURTS_BOS})).

That list turns into useful pages without inventing anything:

- **A criminal defense firm** can write a page for the court divisions where it regularly appears, explaining what happens at arraignment there and where to go. The division names double as the neighborhood names people type into Google.
- **A landlord-tenant practice** has a clear anchor in the Housing Court’s Boston session, for both tenants facing eviction and owners with problem tenancies.
- **A family law firm** can explain what to expect at Suffolk Probate and Family Court, from filing to a first hearing.
- **A real estate or title practice** can explain when a matter goes to the Land Court.

Each page should carry real knowledge from the lawyers who go there, not a paragraph with the place name swapped. Google’s spam policies name doorway pages, pages made to rank for similar searches that funnel visitors to one place, as a violation ([Google spam policies](${SPAM})). A courthouse page earns its place when it would help a client even if they never hired you.

Language is the other half of local search. The Census Bureau’s QuickFacts for Boston reports that 35.6% of residents age 5 and older speak a language other than English at home and 27.8% were born outside the United States (2020 to 2024 figures), and that 19.3% of residents are Hispanic or Latino ([Census QuickFacts, Boston](${CENSUS_BOS})). If someone at your firm serves clients in Spanish, Portuguese, Haitian Creole or Chinese, say so on the home page, on that lawyer’s profile and in your Google Business Profile, and consider pages in that language written or reviewed by a fluent speaker. Comment [1] to Rule 7.2 lists foreign language ability among the things you may advertise; only claim the languages someone can actually use with a client.

## How should a Boston firm set up its Google Business Profile?

Google ranks local results on relevance, distance and prominence ([how Google ranks local results](${LOCAL_RANKING})), and its guidelines are specific about law practices ([Google Business Profile guidelines](${GBP_PRACTITIONERS})):

- **One profile per staffed office.** A downtown office and a Quincy or Cambridge office can each have a profile if clients can meet a lawyer there during posted hours. A virtual office or a mail drop doesn’t qualify.
- **Individual lawyers.** A lawyer in a public-facing role who can be contacted at the verified location during stated hours may have their own profile, but not several profiles for several practice areas. Support staff shouldn’t create profiles.
- **Solo lawyers practicing under a brand.** When a lawyer is the only public-facing practitioner, the guidelines say to share one profile with the firm, named in the form “[brand]: [practitioner name].”
- **The real name only.** Google doesn’t allow extra information in the business name, so “Smith Law” stays “Smith Law,” never “Smith Law Boston OUI Lawyer.”

Link each profile to the matching office page on your site, and keep the name, address and phone number identical in both places.

![A narrow cobblestone lane of red brick row houses with black shutters, its stones covered in fallen autumn leaves](https://images.unsplash.com/photo-1608845920884-3c88800feebc?auto=format&fit=crop&w=1200&q=75)

## What pages does a Boston law firm website need?

A small Boston firm doesn’t need hundreds of pages. It needs the right dozen or two, each answering a real question:

1. **Home page.** Who you represent, in which matters, where, and how to reach you, with the firm name and phone number visible on a phone without scrolling.
2. **One page per practice area.** “Employment discrimination,” not “Litigation.” Each page explains the process in Massachusetts, the deadlines a client should know about, and what to bring to a consultation. For more on writing pages AI answers can quote, see [write pages AI answers can quote](/blog/write-pages-ai-answers-can-quote).
3. **Attorney profiles.** Education, Massachusetts and other bar admissions, languages, the courts each lawyer appears in, and any certification with the certifier named.
4. **Office pages.** Address, hours, parking or the nearest T stop, and a map.
5. **Fees page.** What you charge for flat-fee matters, how hourly and contingency arrangements work, and what isn’t included.
6. **Results and reviews,** with context and a qualifier next to them.
7. **A consultation form** that asks only for what you need to call back and check conflicts.
8. **Disclaimer and privacy pages,** naming the responsible lawyer or firm and explaining that sending the form doesn’t create an attorney-client relationship.

## A checklist before your Boston site goes live

- Every page shows the firm name, meeting Rule 7.2(d).
- “Specialist” and “focuses on” only where accurate; “certified” only with the certifier named and, if needed, the private-organization statement.
- Results have context and a nearby qualifier; reviews are real and unedited.
- Fee information is current and says what’s excluded.
- Lead generators and directories you pay don’t recommend you or analyze clients’ problems.
- Out-of-state admissions are shown on each lawyer’s profile and office page.
- Shared-office arrangements don’t look like a single firm.
- Language claims are true and backed by a real speaker.
- Courthouse and neighborhood pages contain real, specific knowledge.
- One Google Business Profile per staffed office, with the real firm name.
- Structured data describes only what’s on the page ([structured data guidelines](${SD_GUIDELINES})).
- Pages load fast on a phone ([Core Web Vitals](${WEB_VITALS})); see [is your website fast enough](/blog/is-your-website-fast-enough).

## How SaySites builds a Boston law firm website

SaySites builds law firm sites around this structure from the start. Each practice area gets its own page, each attorney a profile, each office its own page, and every page has a consultation form whose intake questions include the other party’s name, so you can run a conflict check before you call back. The firm is described to search engines as a LegalService, each attorney as a Person and each practice area as a Service, and no page goes live until it passes a 95+ speed check. You change anything by saying it in plain words, like “add the certifying board’s full name next to ‘certified’ on Dana’s profile,” and each change waits as a draft until you approve it. SaySites never invents results, reviews or credentials; they come only from you.

The Law Firm Starter plan is $79 a month ([websites for law firms](/websites-for/law-firms), [pricing](/pricing)). If your current site predates the 2022 rules or just feels dated, [ask for a free redesign](/redesign) and see your own pages rebuilt before you pay anything, or [start a 7-day free trial](/signup) and build the new site yourself. Firms licensed in New York as well can read the [New York advertising rule changes](/blog/new-york-law-firm-website-rules), and anyone curious about AI answers can start with [Google AI Overviews for law firms](/blog/google-ai-overviews-for-law-firms).`,
    faq: [
      { q: 'When did the current Massachusetts lawyer advertising rules take effect?', a: 'The Supreme Judicial Court adopted the current versions of Rules 7.1, 7.2 and 7.3 of the Massachusetts Rules of Professional Conduct on July 13, 2022, and they took effect on October 1, 2022. A website built before then may quote outdated rule language in its disclaimer or footer and is worth checking against the text on Mass.gov.' },
      { q: 'What must every page of a Massachusetts law firm website include?', a: 'Rule 7.2(d) requires any communication made under the rule to include the name of at least one lawyer or law firm responsible for its content. A footer with the firm’s full name on every page meets it, including landing pages people reach directly from search. Naming the responsible attorney on the disclaimer page adds clarity.' },
      { q: 'Can a Boston lawyer advertise as a certified specialist?', a: 'Only if the certifying organization is approved by an appropriate state authority or accredited by the American Bar Association, or the ad states that the certifier is a private organization whose standards are not regulated by a state authority or the ABA. Either way, the certifying organization must be named wherever the certification is mentioned.' },
      { q: 'Can a Massachusetts law firm pay for leads?', a: 'Yes, within limits. Comment [5] to Rule 7.2 allows paying a lead generator only if it does not recommend the lawyer, the payment is consistent with Rules 1.5(e) and 5.4, and its own communications meet Rule 7.1. A service that implies it chose the best lawyer for the person’s problem crosses the line.' },
      { q: 'Is a law firm website a solicitation under Rule 7.3?', a: 'No. Comment [1] to Rule 7.3 lists a website, a billboard and an internet banner ad as general communications, not solicitations. Replies to someone who asked for information, such as a consultation form submission, are also excluded. Live person-to-person contact with someone who did not ask, for pecuniary gain, is what the rule restricts.' },
      { q: 'Can a Boston law firm list its fees on its website?', a: 'Yes. Comment [1] to Rule 7.2 lists the basis on which fees are determined, including prices for specific services and payment arrangements, as information a lawyer may share. Keep the figures current, explain what each fee covers and what it leaves out, and avoid unproven comparisons with other firms’ fees.' },
      { q: 'Should a Boston law firm website be in more than one language?', a: 'If a lawyer at the firm serves clients in another language, it often helps. Census QuickFacts reports that 35.6% of Boston residents age 5 and older speak a language other than English at home. Say which lawyers speak which languages, and have translated pages written or reviewed by a fluent speaker.' },
      { q: 'How much does a SaySites law firm website cost?', a: 'The Law Firm Starter plan is $79 a month and starts with a 7-day free trial. It includes practice area pages, attorney profiles, office pages, a consultation form with a conflict-check question, LegalService structured data and hosting. You can also request a free redesign and see your current site rebuilt first.' },
    ],
    about: ['Massachusetts Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Boston, Massachusetts'],
    published: '2026-10-18',
    status: 'published',
  },
  {
    slug: 'miami-medical-practice-website-design',
    title: 'Miami Medical Practice Websites: Florida Ad Rules',
    description: 'What a Miami medical practice website can say under Florida Board of Medicine Rule 64B8-11.001, free-service notices, board certification and telehealth rules.',
    kind: 'guide',
    summary: [
      'Florida Board of Medicine Rule 64B8-11.001 lists eleven ways a physician ad becomes false, deceptive or misleading, from partial disclosure to implying superiority over other doctors.',
      '“Board-certified” requires recognition from an American Board of Medical Specialties board or a Board-approved agency (s. 458.3312), and the certifying board must be named.',
      'Any page advertising a free, discounted or reduced-fee service must carry Florida’s 72-hour statement in capital letters (s. 456.062).',
      'Out-of-state doctors registered for Florida telehealth must link to the Department of Health’s site and can’t open an office in Florida (s. 456.47).',
      'In the city of Miami, 77.2% of residents age 5 and up speak a language other than English at home, so a Spanish site is often worth building.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1586474714711-59ad5a5798bb?auto=format&fit=crop&w=1600&q=75', alt: 'Downtown Miami towers above a waterfront park and arena on Biscayne Bay under a bright sky with scattered clouds' },
    body: `A Miami medical practice website is advertising under Florida law, and the Board of Medicine’s advertising rule, Florida Administrative Code Rule 64B8-11.001, decides most of what it may say. In short: identify each physician by name and as an M.D. (or P.A. or anesthesiologist assistant), say “board-certified” only with a recognized certifying board named beside it, disclose every variable when you quote a fee, never imply you are better than other physicians, and put Florida’s required statement in capital letters on any page that advertises a free or discounted service. Then write the site for the people who actually live in Miami, which in most of the city means writing it in Spanish too.

Below, each of those rules is quoted from its source, followed by Florida’s telehealth registration rule, how referral services fit in, how to set up Google Business Profiles for a group practice, and a page plan and checklist. It’s practical guidance for building a website, not legal advice; for a question about your own advertising, your counsel and the Board’s rule text are the authorities.

## What does Florida’s Board of Medicine allow on a practice website?

Rule 64B8-11.001 opens permissively. The Board allows physicians to share “legitimate information” about the practice of medicine and where to obtain it, as long as it isn’t false, deceptive or misleading ([Rule 64B8-11.001](${FL_64B8})). Subsection (3) defines advertising broadly: any oral or written statement made to the public “with the intent of furthering the purpose” of selling professional services. A practice website, a Google Business Profile, social posts and a YouTube channel all fit.

Subsection (2) is the part to read closely, because it lists what makes an ad false, deceptive or misleading. Paraphrasing each item, an ad crosses the line if it:

1. contains a misrepresentation of facts;
2. makes only a partial disclosure of relevant facts;
3. creates false or unjustified expectations of beneficial assistance;
4. promises something the physician doesn’t expect to perform;
5. contains any other representation likely to mislead;
6. claims specialty recognition from an agency the Board hasn’t approved, without the required disclaimer;
7. says a service can be competently performed for a stated fee when it can’t, or quotes fees without disclosing the variables that affect what patients are actually charged;
8. conveys that the physician is superior to other physicians, beyond a simple list of recognized achievements;
9. fails to conspicuously identify the physician by name;
10. mentions specialty certification without naming the certifying board; or
11. implies a specialty or subspecialty the physician has no recognition for.

Items 3 and 8 are the easiest to break by accident on a website. “Pain-free,” “guaranteed outcomes,” “Miami’s top cardiologist” and “the most advanced care in South Florida” are all common headlines that read as unjustified expectations or claims of superiority. Plain descriptions of what you do, how and for whom are safer, and they give patients comparing practices something real to go on.

The rule ends with practical housekeeping. Subsection (4) says a physician using electronic media must keep an exact copy of an audio or video ad for at least six months after it airs, and subsection (7) requires that M.D.s, P.A.s and anesthesiologist assistants named in ads be clearly identified as such. The rule was last amended effective November 16, 2020.

## Can a Miami doctor say “board-certified” on a website?

Only with the right certifier, named. Florida Statutes section 458.3312 says a physician “may not hold himself or herself out as a board-certified specialist unless the physician has received formal recognition as a specialist from a specialty board of the American Board of Medical Specialties or other recognizing agency that has been approved by the board” ([s. 458.3312](${FL_458_3312})). Rule 64B8-11.001(8) lists the additional agencies the Board has approved, such as the American Board of Facial Plastic and Reconstructive Surgery and the American Board of Pain Medicine.

Recognition from an organization that isn’t on either list can still be mentioned, but only with the disclaimer in subsection (2)(f): that it comes from “a private organization not affiliated with or recognized by the Florida Board of Medicine.”

The statute also leaves room to describe a practice honestly without the credential: a physician “may indicate the services offered and may state that his or her practice is limited to one or more types of services when this accurately reflects the scope of practice.” So “Our practice is limited to sports medicine and joint injections” is fine for a doctor who isn’t board-certified in sports medicine, while “board-certified sports medicine specialist” is not.

On the website, that comes down to three habits:

- On each provider profile, write the full name of the certifying board next to the certification, every time.
- Keep “board-certified” out of page titles, the home page headline and image alt text unless every physician the line refers to holds that certification.
- Separate physicians from other clinicians. Nurse practitioners and physician assistants have their own credentials; list them accurately rather than under a “Our doctors” heading.

![A clean exam room with a stethoscope and blood pressure cuff mounted on the wall, a monitor on an adjustable arm and a rolling stool](https://images.unsplash.com/photo-1682365114691-f0264ad25c52?auto=format&fit=crop&w=1200&q=75)

## What must a “free consultation” or discount page say in Florida?

Florida has a specific statute for this, and it applies well beyond medicine. Section 456.062 says that “in any advertisement for a free, discounted fee, or reduced fee service, examination, or treatment” by a practitioner licensed under chapter 458 and a long list of other health professions, the following statement must appear ([s. 456.062](${FL_456_062})):

> THE PATIENT AND ANY OTHER PERSON RESPONSIBLE FOR PAYMENT HAS A RIGHT TO REFUSE TO PAY, CANCEL PAYMENT, OR BE REIMBURSED FOR PAYMENT FOR ANY OTHER SERVICE, EXAMINATION, OR TREATMENT THAT IS PERFORMED AS A RESULT OF AND WITHIN 72 HOURS OF RESPONDING TO THE ADVERTISEMENT FOR THE FREE, DISCOUNTED FEE, OR REDUCED FEE SERVICE, EXAMINATION, OR TREATMENT.

The statute requires it “in capital letters clearly distinguishable from the rest of the text.” It sets no type size, but a statement hidden in a light grey footer would hardly be clearly distinguishable.

On a website the practical question is where it goes. Put it on each page that offers the free or reduced-fee service: the “free hearing screening” landing page, the “new patient special” banner’s destination page, the “$99 sports physical” page. If your Google Ads or social posts send people to that page, the statement should be on the page they land on. Pages without a free or discounted offer don’t need it.

## How should prices and fees appear?

Posting prices helps patients, especially those paying out of pocket; the city’s QuickFacts lists 18.9% of residents under 65 without health insurance ([Census QuickFacts, Miami](${CENSUS_MIA_CITY})). Florida’s rule doesn’t stop you. It asks that a fee be complete: subsection (2)(g) treats as misleading an ad that represents a service can be competently performed for a stated fee when it can’t, or that makes fee representations without disclosing all the variables that affect the fee actually charged.

A self-pay price list that passes that test says what each price includes (the visit, a basic panel, one follow-up), what can add to it (labs sent out, imaging, a second procedure), and when it was updated. If the price is a promotion, it’s also a reduced-fee ad, and the 72-hour statement above belongs on the page.

## Do names, titles and “superior” claims matter?

They do, and they’re easy to fix. Subsection (2)(i) requires the physician to be conspicuously identified by name, and subsection (7) requires licensees named in ads to be clearly identified as an M.D., P.A. or A.A. A home page that shows only the practice’s name, with no physician named anywhere, misses both. Give each physician a profile page with their full name and credential, and name the responsible physicians on the home page or in the footer.

Superiority is subtler. A simple listing of Board-recognized achievements, such as residency, fellowship and certifications, is allowed. “Miami’s best,” “the leading,” and “#1” rankings from paid directories are the kind of claim subsection (2)(h) addresses.

## Can patients book a telehealth visit with an out-of-state doctor?

Florida allows it, with conditions that should shape your telehealth page. Section 456.47 defines telehealth as using synchronous or asynchronous telecommunications technology to provide health care services, excluding email and fax, and holds telehealth providers to the same standard of care as in-person care in Florida ([s. 456.47](${FL_456_47})).

A physician who isn’t licensed in Florida can treat patients located in Florida by telehealth only after registering with the Board. A registered provider’s website must “prominently display a hyperlink” to the Department of Health’s website, which lists registrants and their Florida telehealth registration numbers, and a registered provider “may not open an office in this state” or provide in-person care to patients in Florida.

For a Miami practice that means:

- If your telehealth visits are with Florida-licensed physicians, say so on the telehealth page.
- If any provider is registered from another state, the required link to the Department of Health belongs on the site, and that provider can’t be presented as seeing patients at your Miami office.
- Say which states you can see patients in, so seasonal residents know whether a video visit is possible once they’ve left Florida.

![A physician in a white coat with a stethoscope writing notes on a clipboard while a patient sits across the desk](https://images.unsplash.com/photo-1758691461990-03b49d969495?auto=format&fit=crop&w=1200&q=75)

## Should a Miami practice website be in Spanish?

For most practices in the city, yes. Census QuickFacts reports that 77.2% of Miami residents age 5 and older speak a language other than English at home, and 57.7% were born outside the United States (2020 to 2024 figures) ([Census QuickFacts, Miami](${CENSUS_MIA_CITY})).

A few things make a Spanish site work rather than just exist:

- **Write it, don’t machine-translate it.** Have pages written or reviewed by someone fluent, ideally someone at the front desk who talks to patients every day and knows the words they use.
- **Translate the disclosures too.** Florida’s rules apply to every ad, in any language, so the 72-hour statement and certifying board names appear on the Spanish pages as well.
- **Say who speaks what.** List each provider’s languages on their profile. Patients often choose a doctor because they can explain symptoms in their first language.
- **Help Google match the versions.** If you run English and Spanish sites, link each page to its counterpart so Google can show the right one ([Google on localized versions](${HREFLANG})).

## How do referral services and agents fit in?

Subsection (5) makes a physician who solicits patients, directly or through an agent, responsible for that advertising, and soliciting through an agent includes accepting patients referred by a business you have an employment or contractual relationship with (managed care plans licensed by Florida’s insurance regulator are excluded). Subsection (6) adds that a physician advertising through a medical referral service is responsible for its content, and the service’s ads must say it acts on behalf of physician members, refers only to physicians who paid for or were selected for membership, limits membership, and that those physicians charge no more than their usual fees, in type comparable to the rest of the ad.

So before paying a directory or “find a doctor” service, read its patient-facing pages. If it presents your listing as an independent recommendation without those disclosures, its ad is still yours under the rule.

## How should a Miami group practice set up Google Business Profiles?

Google ranks local results on relevance, distance and prominence ([how Google ranks local results](${LOCAL_RANKING})), and its guidelines treat practices with several physicians in a particular way ([Google Business Profile guidelines](${GBP_PRACTITIONERS})):

- **The practice gets the location’s profile.** When several practitioners work at one location, the organization should create the profile for that location.
- **Physicians may have their own profiles** if they are public-facing and can be contacted at the verified location during stated hours, titled with the practitioner’s name only. One per physician, not one per specialty.
- **Solo physicians in a branded practice** share one profile, named in the form “[practice]: [physician name].”
- **Departments** that operate as distinct entities, common in larger groups and hospitals, may have their own profiles with names that differ from the main practice.
- **Nothing extra in the name.** “Smith Pediatrics” stays “Smith Pediatrics,” not “Smith Pediatrics Best Pediatrician Miami.”

Practices in Kendall, Doral, Brickell and Coral Gables often draw patients from across Miami-Dade, so make each office page specific: parking, which entrance, whether the building has valet, which Metrorail or Metromover stop is closest and the hours each provider is in.

![An elevated Metromover train crossing a downtown Miami street between palm trees and glass high-rises](https://images.unsplash.com/photo-1618217050253-d740e5d14b2d?auto=format&fit=crop&w=1200&q=75)

## What pages does a Miami medical practice website need?

1. **Home page** with the practice name, physicians named with credentials, whether you’re accepting new patients, insurance basics and a call button that works on a phone.
2. **One page per service or condition** you treat, written in plain language, with what to expect at a visit.
3. **Provider profiles** with full names, credentials, the certifying board named beside any certification, languages and office days.
4. **New patients and insurance** page listing plans you accept, kept current, and self-pay prices with what they include.
5. **Telehealth page** stating who can be seen by video and from which states, with the Department of Health link if any provider is a registered out-of-state provider.
6. **Office pages** with address, hours, parking and directions.
7. **An appointment request form** that asks only for contact details and a short note, and tells patients not to send medical details through it.
8. **A note on every page** that the site isn’t for emergencies and that anyone with an urgent need should call 911.
9. **Spanish versions** of the pages that matter, if you serve patients in Spanish.

On privacy and accessibility, keep two federal points in view. HHS guidance on tracking code warns that pixels on appointment and portal pages can expose protected health information; part of it was vacated by a federal court in 2024, and HHS lists what remains on its site ([HHS guidance on online tracking](${HHS_TRACKING})). And if the practice receives HHS financial assistance, the Section 504 web accessibility deadlines now fall in May 2027 for practices with 15 or more employees and May 2028 for smaller ones ([Federal Register, May 11, 2026](${HHS_504_EXT})).

## A checklist before your Miami site goes live

- Every physician named, conspicuously, with M.D. or the right credential.
- “Board-certified” only with an ABMS board or Board-approved agency, named; other recognition carries the private-organization disclaimer.
- No promises of results, no “best” or “top,” no implied superiority.
- Fees list what’s included and what can change the price.
- The 72-hour statement, in capitals, on every free, discounted or reduced-fee offer page, in every language.
- Telehealth page accurate; required Department of Health link for any registered out-of-state provider.
- Referral services you pay carry the disclosures in subsection (6).
- Copies of video and audio ads kept for six months.
- Spanish pages written by a fluent speaker, with disclosures included.
- One Google Business Profile per location, and per public-facing physician if you choose, with real names only.
- Structured data matches what each page shows ([structured data guidelines](${SD_GUIDELINES})); see [structured data for local businesses](/blog/structured-data-for-local-businesses).
- The site is fast on a phone ([is your website fast enough](/blog/is-your-website-fast-enough)).

## How SaySites builds a Miami medical practice website

SaySites builds medical practice sites with these pages from day one: a page for each service, a profile for each provider, a new patients and insurance page, office pages, an appointment request form that asks patients not to send medical details, and an emergency note on every page. The practice and its details are described to search engines in structured data, every page has to pass a 95+ speed check before it goes live, and a site can be written in English or in Spanish. You make changes by saying them in plain words, such as “add the 72-hour statement under the free screening offer” or “add Dr. Rivera’s certifying board to her profile,” and each change waits as a draft until you approve it. SaySites never invents credentials, reviews or outcomes.

The Site plan is $15 a month ([websites for medical practices](/websites-for/medical-practices), [pricing](/pricing)). If your current site is out of date, [request a free redesign](/redesign) to see your own pages rebuilt first, or [start a 7-day free trial](/signup) and put the new site together this week. Florida law firms have their own guide to [the Florida Bar’s website rules](/blog/law-firm-website-design-florida), and practices offering aesthetic treatments can compare the Texas approach in [Dallas med spa websites](/blog/dallas-med-spa-website-design).`,
    faq: [
      { q: 'What Florida rule governs medical practice advertising?', a: 'Florida Administrative Code Rule 64B8-11.001, the Board of Medicine’s advertising rule, governs ads by physicians licensed under chapter 458, including websites. It bans false, deceptive or misleading ads and lists eleven examples, such as partial disclosure of facts, unjustified expectations, implying superiority over other physicians and failing to name the physician conspicuously.' },
      { q: 'Can a Florida physician advertise as board-certified?', a: 'Only with formal recognition from an American Board of Medical Specialties board or another agency the Board of Medicine has approved, under section 458.3312, and the certifying board must be named. Recognition from other organizations needs a disclaimer that it comes from a private organization not affiliated with or recognized by the Florida Board of Medicine.' },
      { q: 'What does the Florida 72-hour statement on medical ads say?', a: 'Section 456.062 requires ads for free, discounted or reduced-fee services to state that the patient and anyone responsible for payment may refuse to pay, cancel payment or be reimbursed for other services performed as a result of, and within 72 hours of, responding to the ad. It must appear in capital letters clearly distinguishable from the rest of the text.' },
      { q: 'Can a Miami practice post its prices online?', a: 'Yes. Rule 64B8-11.001(2)(g) only requires fee advertising to be complete: it is misleading to quote a fee for a service that cannot be competently performed for that fee, or to omit variables that affect the fee actually charged. List what each price includes and what can add to it, and update the page when prices change.' },
      { q: 'Can an out-of-state doctor see Florida patients by telehealth?', a: 'Yes, after registering with the Florida Board of Medicine under section 456.47. The registered provider’s website must prominently link to the Department of Health’s website, which lists registrants, and the provider may not open an office in Florida or provide in-person care to patients located in the state.' },
      { q: 'Should a Miami medical website have a Spanish version?', a: 'Usually. Census QuickFacts reports that 77.2% of Miami residents age 5 and older speak a language other than English at home. A Spanish site works best when written or reviewed by a fluent speaker, includes every required disclosure, and lists the languages each provider speaks.' },
      { q: 'How long must a Florida physician keep copies of video ads?', a: 'Rule 64B8-11.001(4) requires a physician who advertises through electronic media to keep an exact copy of the audio or video ad for at least six months after it is aired or shown. Keeping dated copies of website versions and campaign pages is a sensible habit even where the rule does not require it.' },
      { q: 'How much does a SaySites medical practice website cost?', a: 'The Site plan is $15 a month and starts with a 7-day free trial. It includes service pages, provider profiles, a new patients and insurance page, office pages, an appointment request form, an emergency note on every page and hosting. You can also request a free redesign of your current site first.' },
    ],
    about: ['Florida Board of Medicine', 'Medical advertising', 'Medical practice websites', 'Miami, Florida'],
    published: '2026-10-18',
    status: 'published',
  },
  {
    slug: 'phoenix-law-firm-website-design',
    title: 'Phoenix Law Firm Website Design: Arizona Bar Rules',
    description: 'How a Phoenix law firm website should follow Arizona’s rewritten ER 7.1 and 7.3, plus Maricopa County courts, Spanish pages and Valley-wide searches.',
    kind: 'guide',
    summary: [
      'Since January 1, 2021, Arizona’s advertising rules sit almost entirely in ER 7.1 and ER 7.3; ERs 7.2, 7.4 and 7.5 are reserved, and the old filing and “Advertising Material” labelling rules are gone.',
      'Every page still has to name at least one lawyer or firm responsible for it, with contact information such as a phone number, address or email (ER 7.1(c)).',
      '“Specializes in” is allowed if it is true, but “certified specialist” needs certification under Arizona Supreme Court Rule 44, and the certifying body must be named.',
      'Arizona also licenses Alternative Business Structures and Legal Paraprofessionals, so a Phoenix site may compete with firms that look different from a traditional practice.',
      'Phoenix clients search by courthouse, by problem and often in Spanish: 35.9% of residents age 5 and up speak a language other than English at home.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1650917409385-a3a9dc5b1e4c?auto=format&fit=crop&w=1600&q=75', alt: 'A wide downtown Phoenix street lined with palm trees and glass office towers under a clear blue desert sky' },
    body: `A Phoenix law firm website is governed by Arizona Supreme Court Rule 42, and since 2021 nearly all of what it says about advertising lives in two rules: ER 7.1 (no false or misleading communications) and ER 7.3 (solicitation). The practical list is short. Put the name and contact information of a responsible lawyer or firm on every page. Say “certified specialist” only if the certification meets Rule 44, and name the certifying body. Present results so a reasonable reader doesn’t expect the same outcome. Pick a firm name and web address that are accurate. Then build pages around how people in the Valley actually look for help: by the courthouse their case is in, by the problem they have, and in many households in Spanish.

What follows walks through the current Arizona text, what the 2021 rewrite removed, how Alternative Business Structures and Legal Paraprofessionals change the competition, and how to set up pages and Google Business Profiles for a firm that serves Phoenix, Mesa, Scottsdale and the West Valley. It is a practical guide, not an ethics opinion. For a question about your own advertising, the rule text and the State Bar of Arizona’s ethics resources are the authorities.

## What do Arizona’s advertising rules require of a law firm website?

The Arizona Supreme Court rewrote the lawyer advertising rules by Order R-20-0030, effective January 1, 2021 ([the court’s order](${AZ_ORDER})). If your website was built before then, the rule numbers in your footer are probably out of date: ERs 7.2, 7.4 and 7.5 are now “[Reserved],” and their content was folded into ER 7.1 and its comments.

The core of ER 7.1 is one sentence: “A lawyer shall not make a false or misleading communication about the lawyer or the lawyer’s services.” A communication is misleading if it “contains a material misrepresentation of fact or law, or omits a fact necessary to make the statement considered as a whole not materially misleading.” That second half matters on websites, where a headline can be true and still misleading because of what it leaves out.

Paragraph (c) adds the one item every page needs: “Any communication made pursuant to this Rule shall include the name and contact information for at least one lawyer or law firm responsible for its content.” Comment [9] explains that contact information “includes a website address, a telephone number, an email address or a physical office location.” A site-wide footer with the firm name, a phone number and the office address satisfies this on every page at once, including landing pages that people reach straight from a search.

What went away is as useful to know as what stayed. The rewrite deleted the old ER 7.3 requirements to label targeted mail as “Advertising Material,” to file copies with the State Bar, and to wait 30 days before contacting accident victims in writing. It also struck the comment sentence that called any promise of a particular outcome misleading on its own, though promising results is still exactly the kind of statement the general rule catches.

## Can a Phoenix lawyer say “specialist” on a website?

Arizona draws a line between describing your practice and claiming a credential.

Describing is broadly allowed. Comment [6] to ER 7.1 says a lawyer “is generally permitted to state that the lawyer ‘concentrates in’ or is a ‘specialist,’ practices a ‘specialty,’ or ‘specializes in’ particular fields based on the lawyer’s experience, specialized training or education,” subject to the false-and-misleading standard. A criminal defense lawyer who has spent fifteen years on DUI cases in Maricopa County can say she focuses on DUI defense.

Certification is different. ER 7.1(b) says a lawyer “shall not state or imply that a lawyer is certified as a specialist in a particular field of law, unless the lawyer complies with Arizona Supreme Court Rule 44 requirements,” and comment [8] adds that “the name of the certifying organization must be included in any communication regarding the certification.” The State Bar’s Board of Legal Specialization certifies specialists in ten practice areas, and only lawyers certified by that board or by a national entity accredited by the State Bar may advertise themselves as Board-Certified Specialists ([State Bar of Arizona, legal specialization](${AZ_BLS})).

On a website, that suggests three habits:

- Use “focuses on” or “concentrates in” in headings and page titles, where a reader can’t see the qualifier.
- Put “Board-Certified Specialist” only on the profile of the lawyer who holds it, with the full name of the certifying board beside it.
- Check page titles and image alt text too. A title like “Phoenix Certified Family Law Specialists” on a firm page implies every lawyer holds the certification.

## How should a Phoenix firm show results and reviews?

Arizona has no testimonial-specific rule anymore. Reviews, case results and client stories are all judged under the general standard in ER 7.1, and comment [2] gives the test that matters most for a results page: a truthful report of a lawyer’s achievements “may be misleading if presented so as to lead a reasonable person to form an unjustified expectation that the same results could be obtained for other clients in similar matters without reference to the specific factual and legal circumstances of each client’s case.” The same comment says a “clear and conspicuous disclaimer or qualifying language may preclude a finding that a statement is likely to create unjustified expectations.”

A results page that holds up under that test usually has these traits:

1. Each result names the case type, the court or forum, and what happened, rather than a bare dollar figure.
2. Net and gross amounts are not mixed, and fees and costs are explained where a reader might assume the client received the full figure.
3. A qualifier sits next to the results themselves, in readable type, not only in the footer: past results depend on the facts of each case and don’t predict future outcomes.
4. Reviews are real, quoted in full or fairly, and never written or edited by the firm. Google’s contribution policy bans fake engagement on Maps reviews ([Maps user contributed content policy](${MAPS_POLICY})), and the website should hold itself to the same standard. See [how to ask for Google reviews without breaking the rules](/blog/ask-for-google-reviews-the-right-way).

![Downtown Phoenix at dusk, the city lights spreading to the horizon beneath a band of pink and blue clouds](https://images.unsplash.com/photo-1616475309237-e218fafab89b?auto=format&fit=crop&w=1200&q=75)

## Are trade names and “and Associates” allowed in Arizona?

Yes, within limits. Comment [4] to ER 7.1 says a firm “may be designated by the names of all or some of its current members” or “by a trade name if it is not false or misleading,” and that a lawyer or firm “may be designated by a distinctive website address, social media username or comparable professional designation that is not misleading.” Names are misleading if they imply “a connection with a government agency,” with a nonlawyer, or with a public or charitable legal services organization.

The State Bar’s guidance on ERs 7.1 and 7.3 adds two specifics that come up constantly with domain names and branding. Factually accurate trade names are permitted for Arizona firms, and a firm must employ more than one actual associate attorney to use “and Associates” ([State Bar of Arizona guidance on ER 7.1 and 7.3](${AZ_GUIDE})).

For a Phoenix firm the risky patterns are easy to spot:

- A domain like “maricopacountyinjuryhelp.com” can read as a county service. Pair it with the firm’s real name everywhere it appears.
- “Arizona Legal Aid Center” or anything that sounds like a nonprofit clinic implies a public legal services connection.
- “Smith and Associates” when Smith practices alone falls foul of the State Bar’s guidance.

## Can Arizona firms pay for leads, referrals or chat?

This is where the 2021 rewrite changed the most for marketing. The 2021 order struck the old ER 7.2(b) ban on giving anything of value for a recommendation, and the State Bar’s guidance now says plainly that “Arizona lawyers may now pay referral fees to anyone for referring clients to them.” The same guidance reminds lawyers to “train employees and marketing companies,” because what a vendor says on your behalf is still your communication under ER 7.1.

It also answers a question that comes up as more firms add chat to their sites: “Yes, the use of AI is permitted, but you should make clear that the chatbot is not a real person.” If your site has a chat window, the first message should say who or what the visitor is talking to, and anything it says about fees or outcomes is held to the same misleading-communication standard as the rest of the site.

ER 7.3 keeps one firm line. A lawyer may not solicit work by “live person-to-person contact” when a significant motive is pecuniary gain, except with other lawyers, people with a family, close personal or prior professional relationship, and people who routinely use that type of legal service for business. Comment [1] confirms that a website itself is not solicitation, because it is “directed to the general public,” and comment [2] says live contact “does not include chat rooms, text messages, or other written communications that recipients may easily disregard.” A web form, a reply to an inquiry and a text follow-up are all on the safe side of that line. A lead vendor who phones accident victims on your behalf is not.

## What do ABS firms and Legal Paraprofessionals mean for your website?

Arizona allows nonlawyers to own part of a law firm. The court eliminated ER 5.4, the rule barring nonlawyer fee sharing and ownership, effective the same day as the advertising rewrite ([court news release](${AZ_ABS_NEWS})). Entities with nonlawyer owners or decision-makers are licensed as Alternative Business Structures under section 7-209 of the Arizona Code of Judicial Administration ([ABS program](${AZ_ABS})). A licensed ABS may use the designation “Arizona licensed” with its name, and no other business may use a title “reasonably likely to induce others to believe the business holds a valid ABS license” ([ACJA § 7-209](${AZ_7209})).

Arizona also licenses Legal Paraprofessionals. As of December 31, 2024, LPs could be licensed in family law, administrative law, limited jurisdiction civil law, criminal law, probate law and juvenile dependency law ([Legal Paraprofessional program](${AZ_LP})). LPs are bound by Rule 42 with “legal paraprofessional” substituted for “lawyer,” so ER 7.1 and 7.3 apply to their sites too, and they must use the title “Arizona Legal Paraprofessional” or “LP” with their license number on documents they prepare ([ACJA § 7-210](${AZ_7210})).

Two things follow for a traditional Phoenix firm’s website:

- **Clients are comparing more kinds of providers.** Someone searching for help with an uncontested divorce or an eviction answer may see an LP or an ABS-owned company next to your firm. Your pages need to say plainly who will handle the matter, what a lawyer adds, and what the first step costs.
- **Be exact about your own status.** If the firm is an ABS, “Arizona licensed” is the designation the code provides. If it isn’t, avoid wording that implies a license you don’t hold. If you employ LPs, list them with their LP title so clients know who is who.

## How do people in Phoenix search for a lawyer?

Phoenix is big and spread out. The Census Bureau puts the city’s population at 1,665,481 as of July 2025, with 42.0% of residents Hispanic or Latino and 35.9% of people age 5 and older speaking a language other than English at home ([Census QuickFacts, Phoenix](${AZ_CENSUS})). The State Bar reported 19,406 active members at the end of 2023 ([State Bar of Arizona annual report](${AZ_BAR_REPORT})), many of them competing for the same Valley searches. Three things about the local landscape shape a good firm site.

**People search by courthouse.** The Maricopa County Superior Court runs its main downtown complex on Jefferson and Madison Streets, the Southeast Justice Center in Mesa, the Northeast Regional Center on North 40th Street in Phoenix, the Northwest Regional Center in Surprise, and juvenile court on West Durango Street ([Superior Court locations](${AZ_COURTS})). Family cases are heard at the regional centers as well as downtown, so a divorce client in Surprise and one in Ahwatukee may be going to different buildings. A family law page that explains which location handles what, with parking and security tips, answers a question people actually search.

**Small cases go elsewhere.** Maricopa County has 26 justice court precincts, which hear small claims up to $5,000 and civil suits up to $10,000 ([Maricopa County Justice Courts](${AZ_JUSTICE})). The Phoenix Municipal Court, at 300 West Washington Street, describes itself as Arizona’s largest limited jurisdiction court and among the ten busiest municipal courts in the country ([Phoenix Municipal Court](${AZ_MUNI})). A DUI or misdemeanor practice that explains the city court process, step by step, serves readers better than a generic “criminal defense” page. Federal matters go to the Sandra Day O’Connor U.S. Courthouse at 401 West Washington Street ([District of Arizona, Phoenix](${AZ_FED})).

**Many clients read Spanish first.** If a lawyer or staff member at the firm serves clients in Spanish, a Spanish version of the site lets those clients read about their problem in the language they think in. Write it, don’t machine-translate it; keep the ER 7.1(c) contact line and every result qualifier on the Spanish pages; and say on each attorney profile which languages that lawyer speaks. If nobody at the firm speaks Spanish, don’t publish Spanish pages that suggest otherwise.

![A Valley Metro light rail train stopped beside downtown Phoenix office towers as people walk and cycle along the platform](https://images.unsplash.com/photo-1597271479771-757112f11d9f?auto=format&fit=crop&w=1200&q=75)

## Should a Phoenix firm make pages for Scottsdale, Mesa and Glendale?

Only when there is something real to say. Google’s spam policies name doorway pages, including “multiple domain names or pages targeted at specific regions or cities that funnel users to one page,” as a violation ([Google spam policies](${SPAM})). A set of “Mesa personal injury lawyer,” “Chandler personal injury lawyer” and “Gilbert personal injury lawyer” pages that differ only in the city name is exactly that.

A location page earns its place when it carries information a client in that place needs: the staffed office’s address, hours and parking; which courthouse handles their case (the Southeast Justice Center for many East Valley matters, for instance); and the lawyers who actually work from that office. If your only office is downtown, one strong page explaining how you serve clients across the Valley, including remote consultations, beats a dozen thin ones.

The same discipline applies to Google Business Profile. Google’s guidelines say a virtual office, meaning a rented mailing address the business doesn’t operate from, isn’t eligible for a profile, and a co-working space qualifies only if the office has clear signage, receives customers during business hours and is staffed by your own people ([Business Profile guidelines](${GBP_GUIDELINES})). Lawyers count as individual practitioners: each lawyer who can be contacted directly at the verified location may have a profile, but a practitioner “shouldn’t have multiple Business Profiles to cover all of their specializations.” A firm with offices downtown and in Scottsdale can have a profile for each staffed office. It shouldn’t have one for a mailbox in Peoria. For how those profiles get chosen for the map, see [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).

![Rugged desert mountain rising behind tree-lined Phoenix neighborhoods under a clear blue sky](https://images.unsplash.com/photo-1566855016870-41e82a391a9f?auto=format&fit=crop&w=1200&q=75)

## What pages should a Phoenix law firm website have?

Start with the pages that answer a client’s first questions, then add depth where the firm actually practices.

- **Home.** What you do, for whom, where, and how to reach a lawyer today. The responsible lawyer or firm and contact details in the footer.
- **One page per practice area you handle as real work.** Each one explains the problem, the process in Maricopa County, what it costs to start, and who at the firm handles it.
- **Attorney profiles.** Bar admissions, years in practice, languages, and any Board certification with the certifying body named. A real photo of the real lawyer.
- **Results, with qualifiers,** if you publish them at all.
- **Office pages** for each staffed office, with address, hours and parking.
- **A Spanish section** if the firm serves Spanish-speaking clients.
- **A consultation form** on every page that asks only what you need to call back and run a conflict check.

Pages written this way are also the pages AI answers can quote. Google says its AI features draw on the same signals as search and need no special markup ([AI features and your website](${GOOGLE_AI})); clear, specific answers to real questions are what get pulled into an answer. More on that in [Google AI Overviews: what law firms should know](/blog/google-ai-overviews-for-law-firms).

## A launch checklist for an Arizona law firm website

1. Every page names a responsible lawyer or firm with contact information (ER 7.1(c)).
2. Footer and disclaimer text no longer cite ERs 7.2, 7.4 or 7.5 as if they had text.
3. “Specializes in” appears only where it is true; “certified specialist” appears only with Rule 44 certification and the certifying body named (ER 7.1(b), comment [8]).
4. Results show the case type, forum and outcome, with a qualifier beside them (comment [2]).
5. Reviews are real and unedited; nothing is written by the firm or a vendor.
6. The firm name, domain and social handles are accurate; “and Associates” only with more than one associate attorney.
7. Any chatbot says it isn’t a person, and marketing vendors know the rules.
8. No vendor makes live person-to-person contact with prospects on the firm’s behalf (ER 7.3).
9. ABS status and LP titles, if any, are stated exactly.
10. Spanish pages exist only if someone at the firm serves clients in Spanish, and they carry the same disclosures.
11. One Business Profile per staffed office; no virtual office listings.
12. Structured data describes only what each page shows ([structured data guidelines](${SD_GUIDELINES})).

## How SaySites builds a Phoenix law firm site

SaySites was built for exactly this kind of site. A law firm site comes with a page per practice area, a profile for each attorney, a page for each office, and a consultation form on every page whose intake questions ask for the other party’s name, so you can check conflicts before you call back. The firm is described to search engines as a LegalService, each attorney as a Person and each practice area as a Service, and no page goes live until it passes a 95+ speed check. A site can be written in English or in Spanish.

You make changes by typing them in plain words, such as “change ‘certified’ to ‘focuses on’ on Maria’s profile” or “add the results disclaimer under the verdicts list,” and each change waits as a draft for you to approve. SaySites never invents a result, review, credential or photo; those come only from you.

The Law Firm Starter plan is $79 a month ([websites for law firms](/websites-for/law-firms), [all pricing](/pricing)). If you already have a site, [request a free redesign](/redesign) and see your own pages rebuilt under Arizona’s rules before you decide, or [start a 7-day free trial](/signup) and draft the new site yourself this afternoon. Firms licensed in more than one state can compare the [California rules for Los Angeles firms](/blog/los-angeles-law-firm-website-design) and [Florida’s filing requirements](/blog/law-firm-website-design-florida).`,
    faq: [
      { q: 'What must an Arizona law firm website include?', a: 'ER 7.1(c) requires every communication to include the name and contact information of at least one lawyer or law firm responsible for its content. Comment [9] says contact information includes a website address, phone number, email address or physical office location. A site-wide footer with the firm name, phone and office address covers every page, including landing pages.' },
      { q: 'Do Arizona lawyers still file website ads with the State Bar?', a: 'No. The Arizona Supreme Court’s rewrite effective January 1, 2021 removed the old filing and “Advertising Material” labelling requirements, along with the 30-day wait before written contact with accident victims. The rules that remain for websites are mainly ER 7.1 on false or misleading communications and ER 7.3 on live solicitation.' },
      { q: 'Can a Phoenix lawyer call themselves a specialist?', a: 'Saying you specialize in or concentrate in a field is generally allowed if it is true, under comment [6] to ER 7.1. Claiming to be a certified specialist requires certification that meets Arizona Supreme Court Rule 44, such as from the State Bar’s Board of Legal Specialization, and the certifying organization must be named wherever the certification is mentioned.' },
      { q: 'Can an Arizona law firm pay for leads or referrals?', a: 'Arizona removed its ban on paying for recommendations in 2021, and the State Bar’s guidance says lawyers may now pay referral fees to anyone. The firm is still responsible for what vendors say, which must not be false or misleading, and no one may make live person-to-person solicitation calls for the firm except as ER 7.3 allows.' },
      { q: 'Can a Phoenix firm use an AI chatbot on its website?', a: 'Yes. The State Bar of Arizona’s guidance says AI use is permitted but the firm should make clear the chatbot is not a real person. Treat anything the chatbot says about fees, timelines or outcomes like any other statement on the site: it must not be false or misleading, and a lawyer should review how it answers.' },
      { q: 'What is an ABS law firm in Arizona?', a: 'An Alternative Business Structure is a business licensed under ACJA section 7-209 that includes nonlawyers with an economic interest or decision-making authority and provides legal services. Arizona allowed them after eliminating ER 5.4 effective January 1, 2021. A licensed ABS may use the designation “Arizona licensed,” and other businesses may not imply they hold that license.' },
      { q: 'Should a Phoenix law firm website be in Spanish?', a: 'If someone at the firm serves clients in Spanish, it often helps: Census figures show 35.9% of Phoenix residents age 5 and older speak a language other than English at home. Have the pages written or reviewed by a fluent speaker, keep every disclosure on them, and say which lawyers speak Spanish.' },
      { q: 'How much does a SaySites law firm website cost?', a: 'The Law Firm Starter plan is $79 a month with a 7-day free trial. It includes practice area pages, attorney profiles, office pages, a consultation form with a conflict check question, LegalService structured data and hosting. You can also send your current site for a free redesign and see your own pages rebuilt first.' },
    ],
    about: ['Arizona Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Phoenix, Arizona'],
    published: '2026-10-17',
    status: 'published',
  },
  {
    slug: 'atlanta-dental-practice-website-design',
    title: 'Atlanta Dental Websites: Georgia Advertising Rules',
    description: 'What an Atlanta dental practice website can and can’t say under Georgia Board of Dentistry rules, plus HIPAA, reviews, accessibility and new-patient pages.',
    kind: 'guide',
    summary: [
      'Georgia Board of Dentistry Rule 150-10-.01 treats your website as advertising, makes the dentist responsible for it, and requires a copy of each ad to be kept for at least a year after its last use.',
      'The rule names phrases that are misleading on their face, including “quality dentistry,” “modern office,” “latest modern equipment” and any claim that treatment is painless.',
      'Only dentists who meet the educational requirements for one of Georgia’s 12 recognized specialties may call themselves specialists; a general dentist can offer implants or aligners but not claim to specialize in them.',
      'Advertised fees and “free” offers must be honored for at least 60 days after the ad last runs, and fee ranges must show both the minimum and the maximum.',
      'Patient photos and stories need written consent, review replies must never reveal patient information, and tracking code on appointment forms can raise HIPAA questions.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1663601460253-aba72eea6edf?auto=format&fit=crop&w=1600&q=75', alt: 'Atlanta’s skyline in soft evening haze, with a tall tower topped by a gold spire rising above the downtown office blocks' },
    body: `An Atlanta dental practice website counts as advertising under Georgia law, so it has to follow Georgia Board of Dentistry Rule 150-10-.01 on fraudulent, misleading or deceptive advertising. In short: the dentist is responsible for every claim on the site and must keep copies; certain phrases such as “quality dentistry,” “modern office” and “painless” are treated as misleading; “specialist” is reserved for the 12 specialties Georgia recognizes; advertised prices and free offers must be honored for 60 days; and nothing about a patient appears without written consent. Get those right, then build the site around what Atlanta patients actually check first: whether you take their insurance, whether you’re taking new patients, and how hard you are to get to.

This guide quotes the Georgia rules, explains the federal rules that touch dental sites (HIPAA tracking guidance, the FTC’s review rule and accessibility), and ends with the pages and checklist an Atlanta practice needs. It’s practical guidance, not legal advice; the Georgia Board of Dentistry and your own counsel have the final word on your ads.

## Does Georgia treat a dental website as advertising?

Yes. Rule 150-10-.01(1) defines advertising broadly: it “shall include any information communicated in a manner designed to attract public attention to the practice of the licensee, including the use of a trade name or corporate name” ([Ga. Comp. R. & Regs. 150-10-.01](${GA_ADV})). A practice website, its Google Business Profile, social posts and paid search ads all fit that description.

Two duties follow from paragraph (2), and both are easy to miss when a marketing agency runs the site:

- **Responsibility.** “The dentist shall have ultimate responsibility for all advertisements approved or placed by the dentist or his or her agents, employees, or associates.” A claim an agency wrote is still your claim.
- **Records.** The dentist “shall retain a copy, recording, or specification of the advertisement for at least one year following the last appearance or use of the advertisement,” and must provide a copy to the Board within ten days of a request.

Websites change constantly, so the records duty needs a habit. Save a dated PDF or screenshot of the home page, every specials or pricing page and every treatment page each time it changes, and keep them for at least a year after that version comes down. If your website platform keeps a version history, check how long it keeps it before relying on it.

The rule rests on O.C.G.A. § 43-11-47, the Georgia Dental Practice Act’s grounds for discipline, which include knowingly making any “fraudulent, misleading, or deceptive statement in any form of advertising” or any statement in an advertisement “concerning the quality of the dental services rendered” ([O.C.G.A. § 43-11-47](${GA_STATUTE})).

## Which words does Georgia treat as misleading on a dental website?

Paragraph (6) of the rule lists statements that “shall be deemed to be misleading.” This is the part of Georgia’s rule that catches the most ordinary website copy, because many of the banned phrases are marketing clichés:

- Statements “claiming or implying the superiority of a method of treatment, material, drug or appliance.”
- “Quality dentistry,” “quality work,” “staff of skilled dentists” and “skilled employees.”
- “Scientifically equipped,” “latest modern equipment,” “modern office,” “modern methods” and “modern devices.”
- Statements “that a dental operation or treatment can be performed without causing any pain.”
- Saying a dentist practices at a location where he or she does not regularly treat patients.
- A trade name or corporate name “confusingly similar to a trade name or corporate name already in use by a dental practice in this state.”

The fix is to replace labels with facts a patient can check. Here are rewrites that keep the meaning without the banned wording:

1. Instead of “Quality dentistry in Midtown,” try “General and family dentistry in Midtown, accepting new patients.”
2. Instead of “Our modern office has the latest equipment,” describe what you actually use: “We take digital X-rays and use an intraoral camera, so you can see what we see on a screen.”
3. Instead of “Painless dentistry,” describe what you offer for comfort: “We offer numbing gel before injections, and nitrous oxide for patients who want it.”
4. Instead of “The best implant system available,” say which system you place and why you chose it, without claiming it beats the others.
5. Instead of “Our skilled team,” introduce the team: names, roles, years in practice and a real photo of each person.

Check the parts of the site people forget: page titles, image alt text, the meta description that appears in Google, and the practice’s Google Business Profile description all count as communications designed to attract attention to the practice.

![A dental hygienist in blue gloves examines a smiling patient’s teeth while he leans back in the chair](https://images.unsplash.com/photo-1663755489920-5e09f66d011a?auto=format&fit=crop&w=1200&q=75)

## Can a general dentist in Atlanta say “specialist” on a website?

Not unless the dentist qualifies. Rule 150-10-.01(6)(b) makes it misleading to claim to be a specialist “unless that specialty is recognized by the Georgia Board of Dentistry pursuant to Rule 150-11-.01 and the dentist has completed the educational requirements” in the American Dental Association’s specialty practice guidelines.

Rule 150-11-.01 says the Board “recognizes twelve (12) specialties of dental practice”: dental public health, endodontics, oral pathology, oral and maxillofacial surgery, orthodontics, pediatric dentistry, periodontics, prosthodontics, oral and maxillofacial radiology, dental anesthesiology, oral medicine and orofacial pain ([Ga. Comp. R. & Regs. 150-11-.01](${GA_SPEC})). That list lines up with the 12 specialties recognized nationally by the National Commission on Recognition of Dental Specialties and Certifying Boards ([recognized dental specialties](${NCRDSCB})).

The same rule makes clear that a general dentist may still perform specialty procedures, “provided that the dentist does not represent himself or herself as a specialist.” On a website, that means:

- “We place dental implants” and “We offer clear aligner treatment” are fine for a general dentist who does that work.
- “Implant specialist,” “Invisalign specialist” and “cosmetic dentistry specialist” are not, because implants and cosmetic dentistry aren’t recognized specialties, and aligners belong to orthodontics.
- A pediatric dentist or orthodontist who completed the specialty program can say so, and should name the specialty exactly as Georgia lists it.
- Watch page titles. “Atlanta Implant Specialists” as a title tag makes the claim even if the page text is careful.

## How should an Atlanta practice advertise fees, specials and free exams?

New-patient specials are common on dental sites, and Georgia’s rule sets specific conditions in paragraph (3)(d):

- **Ranges must be complete.** “If a range of fees is advertised (including use of words such as ‘from,’ ‘as low as,’ ‘starting at’), the minimum and maximum fees shall be fully disclosed.” “Crowns from $X” alone doesn’t meet this; “Crowns from $X to $Y” does.
- **Prices and free offers last 60 days.** An advertised fee, or a service advertised as “free” or “no charge,” must be honored for at least 60 days after the last publication, unless the ad gives another date. Put an end date on every special, and remember that a page left up keeps the offer running.
- **Related services.** Follow-up services related to an advertised one must be provided at no extra charge unless the ad says: “ADDITIONAL CHARGES MAY BE INCURRED FOR RELATED SERVICES WHICH MAY BE REQUIRED IN INDIVIDUAL CASES.” If your new-patient exam special doesn’t include X-rays or a cleaning, say what it includes and add that statement.

A simple pattern keeps specials honest: one “New patient offers” page with each offer, what it includes, what it doesn’t, the dates it runs, and the required statement, and nothing promotional anywhere else that contradicts it.

## Can a dental website show patient photos, reviews and testimonials?

Yes, with consent and care. Rule 150-10-.01(5) says advertising “shall not reveal a patient’s personally identifiable facts, data or information obtained in a professional capacity, without the patient’s written consent.” Before-and-after photos, a patient’s first name with their story, or a video testimonial all need that written consent on file, and the photos should be real results from your practice.

Reviews raise two more rules.

**The FTC’s rule on fake reviews.** The Federal Trade Commission’s Consumer Reviews and Testimonials Rule took effect on October 21, 2024 ([Federal Register](${FTC_FR})). It bans fake reviews and testimonials, including AI-generated ones, and buying positive or negative reviews ([FTC announcement](${FTC_PRESS})). Section 465.4 bars offering compensation or incentives for reviews “expressing a particular sentiment, whether positive or negative” ([16 CFR 465.4](${FTC_4654})), and section 465.7 bars implying that the reviews you display are all or most of the reviews you received when you have suppressed negative ones ([16 CFR 465.7](${FTC_4657})). Showing only five-star reviews under a heading like “What our patients say” edges toward that line; quoting a mix, or linking to your full Google reviews, doesn’t.

**HIPAA and review replies.** The HHS Office for Civil Rights has settled with dental practices that disclosed patient information while answering online reviews. In 2022 a California practice paid $23,000 after its replies to reviews disclosed patient names, treatment and insurance details, and OCR said plainly that “providers cannot disclose protected health information of their patients when responding to negative online reviews” ([HHS settlement announcement](${HHS_NEWVISION})). A Dallas dental practice paid $10,000 in 2019 over disclosures on social media ([HHS resolution agreement](${HHS_ELITE})). A safe reply thanks the reviewer, confirms nothing about whether they are a patient, and invites them to call the office.

## Do tracking pixels on a dental website raise HIPAA issues?

They can. HHS defines a tracking technology as “a script or code on a website or mobile app used to gather information about users or their actions,” and its bulletin explains when using one on a covered entity’s site can disclose protected health information ([HHS guidance on online tracking](${HHS_TRACKING})). On June 20, 2024, a federal court in Texas vacated one part of that guidance: the position that HIPAA is triggered when tracking connects a visitor’s IP address with a visit to a public, unauthenticated page about health conditions or providers. HHS’s page still carries the rest of the bulletin, including tracking on patient portals and similar authenticated pages.

For a dental practice, the practical steps are:

1. List every script on the site: analytics, ad pixels, chat widgets, scheduling tools, embedded maps and video.
2. Keep advertising pixels off appointment request forms, patient portals and anything a patient fills in.
3. Ask each vendor that could receive patient information whether it will sign a business associate agreement. If it won’t, don’t send it patient information.
4. Keep the website’s contact form to scheduling details, and say on the form not to send medical history or insurance ID numbers through it.

![A dentist points to a dental X-ray on a wall-mounted screen while a seated patient looks up at it](https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=75)

## Does an Atlanta dental website have to be accessible?

Accessibility is both a legal question and a practical one, since patients who use screen readers or can’t use a mouse need to book too. The Justice Department’s web guidance says Title III of the ADA prohibits discrimination against people with disabilities by businesses open to the public, and points to the Web Content Accessibility Guidelines as helpful guidance ([ADA web guidance](${ADA_WEB})).

Practices that receive federal financial assistance from HHS, which can include billing Medicaid or Georgia’s PeachCare for Kids, have a dated deadline. Under the Section 504 rule, recipients with 15 or more employees must meet WCAG 2.1 Level A and AA starting May 11, 2027, and those with fewer than 15 employees starting May 10, 2028 ([45 CFR 84.84](${HHS_504})). HHS extended those dates by a year in May 2026 ([Federal Register notice](${HHS_504_EXT})).

The basics fix most problems: real text instead of text in images, alt text on photos, labels on every form field, enough color contrast, and pages that work with a keyboard. They also tend to make the site faster, which helps every visitor ([is your website fast enough?](/blog/is-your-website-fast-enough)).

## How do Atlanta patients choose a dentist online?

Most people looking for a new dentist want three answers before they call, and a good site gives them on the first screen.

**Insurance.** List the plans you accept by name, and keep the list current. If you take Medicaid or PeachCare for Kids, say so; PeachCare is Georgia’s program for uninsured children, and its benefits include dental care ([PeachCare for Kids](${PEACHCARE})). If you’re out of network with most plans, say what you do instead, such as filing claims for patients or offering an in-house membership plan.

**Availability.** “Accepting new patients” at the top of the home page answers the most common question. If you see emergencies the same day, say what counts as an emergency and how to reach you after hours.

**Getting there.** Atlanta is a driving city with a rail and bus network, so tell people how to arrive: parking (garage, deck validation or surface lot), the building entrance, the suite number, and the nearest MARTA station or bus route if one is within walking distance ([MARTA](${MARTA})). An office inside a medical building on Peachtree Street needs different directions than a strip-center office in Decatur.

The Census Bureau counts 529,110 people in the city of Atlanta, with 12.2% of residents age 5 and older speaking a language other than English at home ([Census QuickFacts, Atlanta](${GA_CENSUS})). If someone on your team speaks Spanish, Korean, Vietnamese or another language your patients use, say so on the team page and in your Google Business Profile.

On Google Business Profile, dentists are individual practitioners. Each dentist who sees patients directly at the verified location may have a profile, and a practice with several dentists should also have a profile for the location itself ([Business Profile guidelines](${GBP_GUIDELINES})). Keep the practice name in the profile exactly as it appears on your sign and site. Rule 150-10-.01(6)(c) also makes it misleading to list a dentist at a location where that dentist doesn’t regularly treat patients, so a dentist who works at your Buckhead office only, and not at your Decatur office, should appear only on the Buckhead page and profile.

![The Atlanta skyline reflected in a still lake ringed by green trees under a bright, cloudy sky](https://images.unsplash.com/photo-1702494600481-043a92b6271e?auto=format&fit=crop&w=1200&q=75)

## What pages should an Atlanta dental practice website have?

- **Home:** who you are, which neighborhood, hours, whether you’re accepting new patients, and a phone number that calls with one tap.
- **New patients:** what happens at the first visit, how long it takes, what to bring, and a request form.
- **Insurance and payment:** the plans you accept by name, financing if you offer it, and any membership plan.
- **One page per treatment** you actually provide: cleanings, fillings, crowns, implants, clear aligners, whitening, emergency visits. Each page describes the treatment, who it suits and what it involves, with no superiority claims.
- **Team:** each dentist and hygienist with a real photo, role, education and, for specialists, the specialty named as Georgia lists it.
- **Offers,** if you run them, with dates and the required related-charges statement.
- **Contact and directions:** address, suite, parking, MARTA access, hours and a map.

For more on the first page people see, read [what to put on your home page so visitors get in touch](/blog/what-to-put-on-your-home-page). Practices with an office in Texas as well can compare [Houston’s dental website rules](/blog/houston-dental-practice-website-texas-rules).

## A checklist for a Georgia dental website

1. A dated copy of each version of every page is kept for at least a year after it changes (Rule 150-10-.01(2)).
2. No “quality dentistry,” “skilled staff,” “modern office,” “latest equipment” or “painless,” including in titles and alt text (paragraph (6)).
3. No claims that a method, material or appliance is superior.
4. “Specialist” only for qualified dentists in one of Georgia’s 12 recognized specialties (Rule 150-11-.01).
5. Fee ranges show the minimum and maximum; offers have end dates and are honored for 60 days (paragraph (3)(d)).
6. The related-charges statement appears with any advertised service that may need more work.
7. Written consent on file for every patient photo, name or story (paragraph (5)).
8. Reviews are real; none are bought, filtered to hide negatives, or written by staff.
9. Review replies reveal nothing about the patient.
10. No advertising pixels on forms or portals; vendors that touch patient information sign a business associate agreement.
11. The site meets WCAG 2.1 AA basics, with the Section 504 dates in mind if you bill Medicaid or PeachCare.
12. Each dentist appears only at the offices where he or she regularly treats patients.

## How SaySites builds an Atlanta dental website

A SaySites dental site starts with the pages patients look for: new patients, insurance and payment, a page for each treatment, the team and contact. The practice is described to Google as a Dentist with its address, phone and hours, and every page passes a 95+ speed check before it goes live. The appointment form can use a new-patient question set that asks nothing clinical, and requests arrive in a Leads pipeline where your front desk tracks each one from first contact to booked.

You change the site by typing what you want, such as “replace ‘quality dentistry’ with ‘family dentistry in Grant Park’” or “add an end date of December 31 to the whitening special,” and each change waits as a draft for you to approve. SaySites never invents reviews, results, credentials or patient photos; those only come from you.

The Site plan is $15 a month ([websites for dentists](/websites-for/dentists), [pricing](/pricing)). If you have a site now, [ask for a free redesign](/redesign) to see your own pages rebuilt under Georgia’s rules, or [start your 7-day free trial](/signup) and make the changes yourself.`,
    faq: [
      { q: 'Is a dental website considered advertising in Georgia?', a: 'Yes. Georgia Board of Dentistry Rule 150-10-.01 defines advertising as any information communicated in a manner designed to attract public attention to the practice, including a trade name. The dentist is ultimately responsible for every ad placed by staff or agents, and must keep a copy of each ad for at least one year after it was last used.' },
      { q: 'What phrases can’t a Georgia dentist use in advertising?', a: 'Rule 150-10-.01(6) deems misleading “quality dentistry,” “quality work,” “staff of skilled dentists,” “skilled employees,” “scientifically equipped,” “latest modern equipment,” “modern office,” “modern methods” and “modern devices,” along with claims that treatment is painless, claims that a method or material is superior, and trade names confusingly similar to another Georgia practice’s name.' },
      { q: 'Can a general dentist in Georgia say they specialize in implants?', a: 'No. Only dentists who meet the educational requirements for one of the 12 specialties the Georgia Board of Dentistry recognizes may represent themselves as specialists, and implant dentistry is not one of them. A general dentist may say the practice places implants or offers clear aligners, as long as nothing presents the dentist as a specialist.' },
      { q: 'How long must a Georgia dentist honor an advertised price?', a: 'At least 60 days after the date the ad was last published or broadcast, unless the ad specifies another date. The same applies to services advertised as free or no charge. A website page counts as published while it is live, so give each special an end date and remove it when the offer ends.' },
      { q: 'Can a dentist reply to a bad Google review?', a: 'Yes, but without revealing anything about the patient. HHS has settled with dental practices that disclosed patient names, treatment and insurance details in review replies, and says providers cannot disclose protected health information when responding to negative reviews. Thank the reviewer, don’t confirm they are a patient, and invite them to call the office.' },
      { q: 'Do dental websites need to meet WCAG accessibility standards?', a: 'The ADA applies to businesses open to the public, and the Justice Department points to WCAG as helpful guidance. Practices that receive HHS financial assistance, such as Medicaid payments, must meet WCAG 2.1 AA under the Section 504 rule from May 11, 2027 with 15 or more employees, or May 10, 2028 with fewer.' },
      { q: 'How much does a SaySites dental website cost?', a: 'The Site plan is $15 a month with a 7-day free trial, and includes hosting, Dentist structured data, a page per treatment, a new-patient request form and the Leads pipeline. You can also send your current site for a free redesign and see your own pages rebuilt before you decide.' },
    ],
    about: ['Georgia Board of Dentistry', 'Dental advertising', 'Dental practice websites', 'Atlanta, Georgia'],
    published: '2026-10-17',
    status: 'published',
  },
  {
    slug: 'philadelphia-law-firm-website-design',
    title: 'Philadelphia Law Firm Website Design: PA Ad Rules',
    description: 'What a Philadelphia law firm website must show under Pennsylvania’s amended Rules 7.1 to 7.3, from dramatization labels to fee disclosures.',
    kind: 'guide',
    summary: [
      'Pennsylvania amended its lawyer advertising rules by a Supreme Court order of October 15, 2024: Rules 7.4, 7.5 and 7.7 are now reserved, and their content moved into Rules 7.1 and 7.2.',
      'Every page should name a responsible lawyer or firm with contact information (Rule 7.2(k)) and the city or town of the office where the lawyers doing the work principally practice (Rule 7.2(h)).',
      'Stock photos of people, actors and AI-generated faces need a dramatization disclosure under Rule 7.2(f), and celebrity endorsements are banned outright by Rule 7.2(e).',
      '“No fee unless we win” must say the client will owe certain expenses if that is the case, and any advertised fee has to be honored for at least 90 days (Rule 7.2(g)).',
      'Philadelphia County has 13,617 active attorneys, the most of any county in the state, so specific pages about real courts and real problems are what set a firm apart.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1517009572053-93fb56dfef49?auto=format&fit=crop&w=1600&q=75', alt: 'Philadelphia City Hall’s clock tower and William Penn statue seen down a sunlit street, with a crosswalk and traffic lights in front' },
    body: `A Philadelphia law firm website has to follow Pennsylvania Rules of Professional Conduct 7.1 through 7.3, which the Supreme Court of Pennsylvania rewrote in late 2024. In practice that means five things: name at least one responsible lawyer or firm with contact information on every page; state the city or town of the office where the lawyers who will do the work principally practice; label any stock photo, actor or AI-generated person as a dramatization; never use a celebrity endorsement or an undisclosed paid one; and if you advertise “no fee unless we win,” say that the client will still owe certain expenses if that is how your agreement works. Then build the site around the way Philadelphians actually look for a lawyer: by problem, by courthouse and on a phone.

This guide quotes the current Pennsylvania rules from the Disciplinary Board’s published text, explains what changed and what didn’t, then covers the Philadelphia court landscape, language access, Google Business Profile for city and suburban offices, AI chat on firm sites and a checklist. It is general information, not legal or ethics advice. The Pennsylvania Bar Association and the Disciplinary Board’s ethics resources are the places to take a question about your own ads.

## What changed in Pennsylvania’s lawyer advertising rules?

By an order dated October 15, 2024, the Supreme Court of Pennsylvania amended Rules 7.1, 7.2, 7.3, 7.4, 7.5 and 7.7, among others, effective 30 days later ([Supreme Court order](${PA_ORDER}); [Disciplinary Board announcement](${PA_ADV_NEWS})). If your website copy was written before then, three changes matter most.

1. **The rule numbers moved.** Rules 7.4 (specialization), 7.5 (firm names) and 7.7 (referral services) are now reserved. Specialist claims live in Rule 7.2(c), and firm names and web addresses are covered in the comments to Rule 7.1 ([current Rules of Professional Conduct](${PA_RPC})). A site footer that cites “Rule 7.4” is citing a rule that no longer has text.
2. **A new identification rule.** Rule 7.2(k) now says: “Any communication made under this Rule must include the name and contact information of at least one lawyer or law firm responsible for its content.”
3. **The old record-keeping provision is gone.** The amended rules no longer contain the requirement to keep copies of advertisements for a set period. Keeping a dated record of each version of your home page and results page is still a sensible habit, because it answers questions later, but the rule itself no longer demands it.

What did not change is just as important. Pennsylvania kept its long list of specific advertising requirements on photos, endorsements, fees and office location, which go well beyond the national model rule. Those are where Philadelphia firm sites most often fall short.

## What must every Pennsylvania law firm web page include?

Two pieces of information, on every page a visitor might land on from a search.

**A responsible lawyer or firm, with contact information.** Rule 7.2(k) requires the name and contact information of at least one lawyer or law firm responsible for the content. The comment explains that “contact information includes a website address, a telephone number, an email address or a physical office location” ([Rule 7.2 and comments](${PA_RPC})). A footer with the firm name, phone number and office address covers it everywhere at once.

**The city or town of the office doing the work.** Rule 7.2(h) is a Pennsylvania original: “All advertisements and written communications shall disclose the geographic location, by city or town, of the office in which the lawyer or lawyers who will actually perform the services advertised principally practice law.” If that office is outside the city or town, the county must be given too. For a Center City firm that is simple. It gets harder for a firm whose website targets Philadelphia clients while its lawyers work out of King of Prussia, Media or Cherry Hill. The disclosure has to name where the lawyers who will handle the case actually practice, not where the firm would like to appear.

Rule 7.2(j) adds a related limit. A firm may not advertise that it handles, or limits its practice to, particular types of cases unless it handles them “as a principal part” of its practice, and “a lawyer or law firm shall not advertise as a pretext to refer cases obtained from advertising to other lawyers.” A site that ranks for a practice area the firm only refers out is exactly what this rule targets.

## Can a Philadelphia firm use stock photos or AI-generated images?

Yes, but in Pennsylvania they need a label. Rule 7.2(f) says an advertisement or public communication “shall not contain a portrayal of a client by a non-client; the re-enactment of any events or scenes; or, pictures or persons, which are not actual or authentic, without a disclosure that such depiction is a dramatization.” The same paragraph says a non-lawyer shall not portray a lawyer or imply that he or she is a lawyer.

That reaches a lot of what appears on law firm websites:

- A stock photo of a smiling family on a page about estate planning shows persons who are not actual clients.
- A photo of a model in a suit on the attorneys page implies a lawyer who is not one of yours.
- An AI-generated image of an injured driver, or a “client” in a video testimonial voiced by an actor, is a portrayal that is not authentic.

The cleanest fix is real photography: your lawyers, your office, your street. Where a stock image of people helps the page, put a short “Dramatization” caption on the image itself, not in a distant footer. Images of places, like the photo of City Hall at the top of this article, show no portrayed client or lawyer and raise no such issue.

![The Philadelphia skyline lit by late-day sun, reflected in the Schuylkill River with trees along the riverbank](https://images.unsplash.com/photo-1581909811589-a1317515f20c?auto=format&fit=crop&w=1200&q=75)

## Are client reviews and testimonials allowed in Pennsylvania?

Pennsylvania does not ban testimonials outright. They are judged under Rule 7.1, which bars any “false or misleading communication about the lawyer or the lawyer’s services,” and under the endorsement rules in Rule 7.2(e). That paragraph is strict: an advertisement with “a paid endorsement shall disclose that the endorser is being paid or otherwise compensated,” and “no advertisement or public communication shall contain an endorsement by a celebrity or public figure” ([Rule 7.2](${PA_RPC})). A local sports figure or TV personality vouching for the firm is out, paid or not.

The Pennsylvania Bar Association’s ethics committee addressed online reviews in Formal Opinion 2014-300. It concluded that attorneys “may accept client reviews but must monitor those reviews for accuracy,” that lawyers may respond to and solicit endorsements, and that a lawyer has a duty to remove or correct inaccurate ones. The opinion also notes the committee’s earlier view that a lawyer may not reveal client confidential information in response to a negative online review ([PBA Formal Op. 2014-300](${PBA_2014_300})).

For a website, that suggests a short set of house rules:

1. Show only real reviews from real clients, with nothing paid for and nothing edited to change the meaning.
2. Pair any review that mentions a result with the same context and qualifier you would give the result itself.
3. Reply to a bad review politely and without discussing the client’s matter.
4. Read your own profiles and the reviews you display at least every few months, and fix anything that has become inaccurate.

## How should a Pennsylvania site talk about fees?

Carefully, because Rule 7.2(g) attaches two conditions to fee statements. First, advertisements “that state or indicate that no fee will be charged in the absence of recovery shall disclose that the client will be liable for certain expenses in addition to the fee, if such is the case.” Second, a lawyer who advertises a specific fee, hourly rate or range of fees for a service “shall honor the advertised fee for at least ninety (90) days,” or for at least a year in media published annually unless the ad says otherwise.

Two practical consequences for a Philadelphia personal injury or consumer firm:

- Put the expense disclosure right beside “No fee unless we win,” in the hero banner and on the fees page, wherever the phrase appears. If your agreements make the client responsible for costs, the site has to say so.
- If you publish flat fees, for example for an expungement, a simple will or a landlord-tenant hearing, treat each published price as a 90-day promise. Date your fee page and change prices only on a schedule you can keep.

## Can a Pennsylvania lawyer say “specialist” on a website?

Only in the ways Rule 7.2(c) lists. A lawyer may not state or imply that they are a specialist except: when certified by an organization approved by the Supreme Court of Pennsylvania; when certified by another state’s highest court, if the communication states that the lawyer is not certified in Pennsylvania; when the claim is objectively verifiable from experience, training or education, in which case the lawyer “shall include a disclaimer stating that the lawyer is not certified in the claimed specialty” and “may not claim specialization in more than one field of law”; and for “patent attorney” and admiralty designations. The comments add that “the name of the certifying organization must be included in any communication regarding the certification” ([Rule 7.2(c) and comments](${PA_RPC})).

On a typical attorney profile:

- **Fine:** “Practice limited to workers’ compensation claims for injured workers.” Rule 7.2(c) allows saying what a lawyer does or does not handle.
- **Fine, with the organization named:** a board certification from an approved certifying organization, listed by its full name.
- **A problem:** “Philadelphia’s DUI specialists” on the home page, “expert divorce attorneys,” or one lawyer described as a specialist in three fields.

## What do Pennsylvania rules say about results, firm names and NJ offices?

Results are governed by Rule 7.1. The comments warn that a truthful report of client results may still mislead if it leads “a reasonable person to form an unjustified expectation that the same results could be obtained for other clients,” and that “an appropriate disclaimer or qualifying language may preclude a finding” of unjustified expectations ([Rule 7.1 comments](${PA_RPC})). Give each result its context: the type of case, the forum, and whether it was a verdict or a settlement, with the qualifier right next to the number.

Firm names and web addresses now sit in the Rule 7.1 comments as well. A firm may use “a distinctive website address, social media username or comparable professional designation that is not misleading.” A trade name with a place in it, the comments’ example being “Springfield Legal Clinic,” may need an express statement that the firm is not a public legal aid organization. Before buying a domain like “phillytenanthelp,” ask whether a visitor could take it for a public service.

Many Philadelphia firms have lawyers admitted in both Pennsylvania and New Jersey, or offices on both sides of the river. The same comments say a firm with offices in more than one jurisdiction may use one name, but “identification of the lawyers in an office of the firm shall indicate the jurisdictional limitations on those not licensed to practice in the jurisdiction where the office is located.” Each attorney profile should list exactly where that lawyer is admitted. New Jersey has its own advertising rules, so check them separately before the site targets New Jersey clients.

Not sure how your current site measures up? Send its address for a [free redesign](/redesign) and see your own pages rebuilt with the contact footer, office location and fee disclosures in place, at no cost and with no commitment.

## Can a Philadelphia firm pay for leads or directory listings?

Yes, within limits. Rule 7.2(b) bars giving anything of value for recommending the lawyer’s services, but allows paying “the reasonable costs of advertisements or communications permitted by this Rule” and the usual charges of a lawyer referral service or legal service plan. The comments confirm a lawyer may pay vendors such as “website designers,” and may pay for Internet-based client leads “as long as the lead generator does not recommend the lawyer.” They add that a lawyer “must not pay a lead generator that states, implies, or creates a reasonable impression that it is recommending the lawyer, is making the referral without payment from the lawyer, or has analyzed a person’s legal problems” ([Rule 7.2 comments](${PA_RPC})).

Before signing with a lead service, read its consumer-facing pages. If they promise to “match you with the best lawyer for your case” or present a free case evaluation that ends in a paid referral, the firm paying for those leads carries the risk.

## When does a firm’s outreach become solicitation?

Rule 7.3 defines solicitation as a communication directed to “a specific person the lawyer knows or reasonably should know needs legal services in a particular matter.” A website is not one: the comments say a communication directed to the general public, “such as through a billboard, an Internet banner advertisement, a website or a television commercial,” or one “automatically generated in response to electronic searches,” is not a solicitation ([Rule 7.3](${PA_RPC})).

What follows the website is where care is needed:

- **Live contact.** Rule 7.3(b) bars live person-to-person solicitation for pecuniary gain except with lawyers and people with a family, close personal or prior professional relationship. The comments say live contact “includes text messages” but “does not include chat rooms or other written communications that recipients may easily disregard.” An unsolicited text to someone you learned was in a crash is live contact.
- **Targeted letters and emails.** Rule 7.3(c) allows targeted direct mail. Pennsylvania has no general waiting period, but Rule 7.3(d) bars solicitation of anyone who has said they do not want contact, and for a defendant or respondent in a domestic relations action the lawyer “shall wait until proof of service appears on the docket.”
- **Website forms.** A visitor who fills in your consultation form has asked to hear from you, so your reply is a response to a request for information, not a solicitation.

## Can a Pennsylvania firm put an AI chat assistant on its site?

It can, with the same duties that apply to any tool. The Pennsylvania Bar Association and the Philadelphia Bar Association issued Joint Formal Opinion 2024-200 on artificial intelligence. It says lawyers “must be competent in the use of AI technologies,” must protect client confidentiality and verify AI output, and concludes that “with appropriate safeguards, lawyers can utilize artificial intelligence in accordance with the Pennsylvania Rules of Professional Conduct” ([Joint Formal Opinion 2024-200](${PA_AI_OPINION})).

Applied to a chat window, the opinion points to three habits. Warn visitors up front to hold back confidential details until the firm has checked for conflicts. Program it to explain process and book consultations, never to assess a case or guess at an outcome. And have a lawyer read its scripts and a sample of its conversations, since Rule 7.1 does not care whether a misleading sentence came from a person or software. Because the visitor starts the conversation, a chat that only replies is not live solicitation under the Rule 7.3 comments.

## How do Philadelphia clients look for a lawyer?

By problem, and often by courthouse. Philadelphia’s courts are spread across several buildings, and clients search for the one on their papers.

- **Family Court** sits at 1501 Arch Street and “consists of two major branches: Juvenile and Domestic Relations” ([Family Court](${PHL_FAMILY})).
- **Municipal Court’s Civil Division** hears “Landlord and Tenant cases, Code Enforcement cases, and Small Claims cases up to $12,000” ([Municipal Court Civil Division](${PHL_MC_CIVIL})).
- **Criminal cases** in the Court of Common Pleas are heard at the Justice Juanita Kidd Stout Center for Criminal Justice, 1301 Filbert Street ([Criminal Division](${PHL_CRIMINAL})).
- **Mass torts.** The Court of Common Pleas runs a Mass Tort Program through its Complex Litigation Center, with dockets that have included asbestos, Roundup, Zantac and hair relaxer cases ([Mass Tort docket list](${PHL_MASS_TORT})).
- **Federal cases** go to the U.S. District Court for the Eastern District of Pennsylvania at 601 Market Street ([E.D. Pa.](${EDPA})).

The competition is dense. The Disciplinary Board’s 2025 annual report counts 47,249 active attorneys in Pennsylvania, and Philadelphia County has 13,617 of them, more than any other county ([2025 Annual Report](${PA_DB_2025})). A home page that lists fifteen practice areas looks like hundreds of others. Pages that explain one real step in one real court, from the firm’s own experience, do not:

- What happens at a first listing in Landlord-Tenant Court, for tenants or for landlords, with a link to the court’s own instructions.
- How a protection from abuse petition works at Family Court, written in plain language.
- What to expect after an arrest, from preliminary arraignment to the first listing at the Stout Center.
- For mass tort firms, which program a product case may join and what that means for timing.

Pages like these match what Google describes as [helpful, people-first content](${HELPFUL}): written from real experience, for a reader with a specific need, and complete enough that they can act on it. They are also the kind of specific, sourced passages that AI answers can quote.

![Floor-to-ceiling wooden shelves of old leather-bound books with a row of marble busts in a long library hall](https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=75)

## Should a Philadelphia firm’s website be in Spanish or other languages?

When someone at the firm can actually serve those clients, it is worth doing. According to the Census Bureau’s 2020 to 2024 estimates, 24.4% of Philadelphians age 5 and older speak a language other than English at home, and 15.2% were born outside the United States ([Census QuickFacts, Philadelphia](${CENSUS_PHL})).

Every rule above applies to translated pages too, including the dramatization label, the fee disclosure and the specialist disclaimer. Say exactly who speaks the language, whether that is a named lawyer, a paralegal or the intake team. Ask a fluent speaker who knows legal terms to review every page before it goes live. Translate the pages people need, such as the practice area, the consultation page and the office details, and connect each version to its English counterpart, which helps Google serve the right language ([localized versions](${HREFLANG})).

## Google Business Profile for city and suburban offices

Google lets law firms and individual lawyers have Business Profiles, but a practitioner “shouldn’t have multiple Business Profiles to cover all of their specializations,” and a virtual office or rented mailing address the business doesn’t operate from isn’t eligible ([Business Profile guidelines](${GBP_GUIDELINES})). A firm based in Center City that rents a mailbox in Media or Doylestown to appear in suburban searches is outside the guidelines, and in Pennsylvania it could also blur the Rule 7.2(h) office disclosure.

The website follows the same logic. Google’s spam policies name doorway pages, including “multiple domain names or pages targeted at specific regions or cities that funnel users to one page,” as a violation ([spam policies](${SPAM})). Give each staffed office its own page with its address, hours and the Rule 7.2(h) location line. A page about Montgomery, Delaware or Bucks County earns its place only if it says something a client there needs, such as how the county courthouse in Norristown, Media or Doylestown handles their kind of case. For the map results themselves, see [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).

## A launch checklist for a Philadelphia law firm website

1. Every page names a responsible lawyer or firm with contact information (Rule 7.2(k)).
2. Every page states the city or town, and county if needed, of the office where the handling lawyers principally practice (Rule 7.2(h)).
3. Stock photos of people, actors and AI-generated images carry a “Dramatization” label on the image; no non-lawyer appears as a lawyer (Rule 7.2(f)).
4. No celebrity or public figure endorsements; any paid endorsement says it is paid (Rule 7.2(e)).
5. “No fee unless we win” sits next to the expense disclosure; published fees are dated and honored for 90 days (Rule 7.2(g)).
6. Specialist claims follow Rule 7.2(c), name the certifying organization, and never cover more than one field under the verifiable-claim option.
7. Results show the case type, forum and verdict or settlement, with a qualifier beside the figures (Rule 7.1).
8. Each attorney profile lists the jurisdictions where that lawyer is admitted.
9. Lead services don’t claim to recommend or evaluate; nothing is advertised as a pretext to refer cases out.
10. Follow-up texts and letters respect Rule 7.3; chat stays reactive and is reviewed by a lawyer.
11. One Business Profile per staffed office, and matching details on each office page.
12. Structured data matches what each page shows ([local business structured data](${LOCAL_SD})).

## Where SaySites fits for a Philadelphia firm

Everything on the checklist above is easier when the site is built around it. With SaySites, a law firm site comes with practice area pages, a profile for each attorney (with room to list every bar admission), a page per staffed office, and a consultation form on every page. Its intake questions ask for the other party’s name, so you can run a conflict check before calling back. Behind the scenes the firm is marked up as a LegalService, each attorney as a Person and each practice area as a Service, and no page goes live until it passes a 95+ speed check. You make edits by typing them in plain words, for example “put ‘Dramatization’ under the family photo on the estate planning page” or “add the expense disclosure next to ‘no fee unless we win,’” and every edit waits as a draft for your approval. SaySites never makes up a result, review, credential or photo; those come only from you.

The Law Firm Starter plan costs $79 a month ([websites for law firms](/websites-for/law-firms), [pricing](/pricing)). If you have a site already, [ask for a free redesign](/redesign) to see your own pages rebuilt under these rules first, or [start a 7-day free trial](/signup) and draft the new site yourself. Practicing across state lines? Compare the [New York rules after the 2026 changes](/blog/new-york-law-firm-website-rules) and the [Illinois rules for Chicago firms](/blog/chicago-law-firm-website-design).`,
    faq: [
      { q: 'What must a Pennsylvania law firm website include?', a: 'Under Rule 7.2(k), each communication must include the name and contact information of at least one lawyer or law firm responsible for its content, such as a phone number, website, email or office address. Rule 7.2(h) also requires the city or town of the office where the lawyers who will do the work principally practice, plus the county if the office is outside that city or town.' },
      { q: 'Do stock photos on a Pennsylvania law firm site need a disclaimer?', a: 'Photos of people who are not actual clients or lawyers do. Rule 7.2(f) bars portrayals of clients by non-clients, re-enactments, and pictures of persons that are not actual or authentic unless the ad discloses that the depiction is a dramatization. A short “Dramatization” caption on the image works. Photos of buildings or places raise no such issue.' },
      { q: 'Can a Philadelphia firm advertise “no fee unless we win”?', a: 'Yes, with a disclosure. Rule 7.2(g) says an ad indicating no fee will be charged without a recovery must disclose that the client will be liable for certain expenses in addition to the fee, if that is the case. Put the disclosure right beside the phrase wherever it appears, including the home page banner and the fees page.' },
      { q: 'Are client testimonials allowed on Pennsylvania lawyer websites?', a: 'Yes, if they are real and not misleading. Pennsylvania has no outright testimonial ban, but Rule 7.2(e) requires disclosure of paid endorsements and bans endorsements by celebrities or public figures. PBA Formal Opinion 2014-300 says lawyers may accept client reviews but must monitor them for accuracy and correct inaccurate ones.' },
      { q: 'When did Pennsylvania change its lawyer advertising rules?', a: 'The Supreme Court of Pennsylvania amended the rules by an order dated October 15, 2024, effective 30 days later. Rules 7.4, 7.5 and 7.7 are now reserved, with specialization moved into Rule 7.2(c) and firm names into the comments to Rule 7.1. Rule 7.2(k) added the requirement to name a responsible lawyer or firm with contact information.' },
      { q: 'Can a Pennsylvania lawyer call themselves a specialist?', a: 'Only as Rule 7.2(c) allows: with certification from an organization approved by the Pennsylvania Supreme Court, with another state’s certification plus a statement that the lawyer isn’t certified in Pennsylvania, or with an objectively verifiable claim that includes a disclaimer that the lawyer is not certified, limited to one field. Name any certifying organization in full.' },
      { q: 'Should a Philadelphia law firm website be in Spanish?', a: 'If someone at the firm can serve Spanish-speaking clients, it often helps. Census figures show 24.4% of Philadelphia residents age 5 and older speak a language other than English at home. Name who speaks the language, have a fluent reviewer check each page, keep every Pennsylvania disclosure on the translated version, and link it to its English page.' },
      { q: 'What does a SaySites law firm website cost?', a: 'The Law Firm Starter plan is $79 a month with a 7-day free trial. It includes practice area pages, attorney profiles, office pages, a consultation form with a conflict check question, LegalService structured data and hosting. You can also send your current site for a free redesign and see your own pages rebuilt before deciding.' },
    ],
    about: ['Pennsylvania Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Philadelphia, Pennsylvania'],
    published: '2026-10-16',
    status: 'published',
  },
  {
    slug: 'san-diego-electrician-website-design',
    title: 'San Diego Electrician Websites: CSLB Rules to EV Jobs',
    description: 'What a San Diego electrician’s website must show under California license rules, and how to build pages for EV chargers, solar, batteries and outage backup.',
    kind: 'guide',
    summary: [
      'California requires a contractor’s license number in all advertising, and the CSLB says that includes websites; put your C-10 number by the phone number on every page.',
      'Don’t say “bonded” in your ads, don’t advertise work outside your license classification, and remember that unlicensed handymen can only advertise jobs under $1,000 that need no permit.',
      'San Diego’s steadiest electrical work has clear official rules worth explaining on its own page: home EV chargers, rooftop solar with batteries and panel upgrades, and backup power for outages.',
      'The City of San Diego and the County issue permits separately, so a service-area page should say which permit office covers which neighborhoods instead of spinning up thin town pages.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1531379972711-3c48ecf21e04?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown San Diego’s towers and apartment blocks with a busy freeway in the foreground and the bay beyond' },
    body: `A San Diego electrician’s website has to do two jobs: satisfy California’s contractor advertising rules and answer the specific questions San Diego customers ask before they call. On the rules side, show your Contractors State License Board (CSLB) license number on the site, ideally beside the phone number on every page; advertise only work your C-10 classification covers; and never describe the business as “bonded.” On the customer side, give each of the region’s steadiest jobs its own clear page: home EV chargers, rooftop solar with batteries and panel upgrades, and backup power for outages and planned shutoffs. Each of those has official permit and utility rules you can explain better than anyone else.

Every rule below links to its source at the CSLB, the Department of Industrial Relations, the City or County of San Diego, or SDG&E. After the rules come language, service areas, Google Business Profile, structured data and a launch checklist. Treat this as general information rather than legal advice; the CSLB answers questions about a specific license or ad.

## Does California require a license number on an electrician’s website?

Yes. The CSLB’s advertising guidelines say licensed contractors must include their license number in all construction contracts, subcontracts, calls for bid “and all forms of advertising,” and they list “any website or post that solicits business on the Internet” among the forms advertising takes. The civil penalty for not complying “is between $100 and $1,000 for a first offense” ([CSLB Advertising Guidelines](${CSLB_ADS})). A CSLB industry bulletin says the same about online ads: the license number is required, and “this includes online sales postings and websites” ([CSLB Bulletin 20-21](${CSLB_ADS_BULLETIN})).

Where should it go? Customers check licenses. The CSLB runs a public [license lookup](${CSLB_LOOKUP}), and a careful homeowner hiring someone to open their panel will use it. Make that easy:

- Put “CSLB Lic. #” and the number in the header or footer of every page, next to the phone number.
- Repeat it on the contact page and on quote or estimate pages.
- Use the exact business name the license is issued to, so the lookup matches what the customer sees.
- Add it to your Google Business Profile description and your social profiles, which are advertising too.

## What else can’t an electrician’s ad say in California?

Three rules from the CSLB catch contractors out online.

**Stay inside your classification.** The CSLB says you “cannot advertise for construction work outside of areas for which you are licensed,” using the example that a masonry contractor “cannot advertise for electrical work, unless he or she also holds a C-10 Electrical contractor license” ([CSLB Advertising Guidelines](${CSLB_ADS})). The reverse applies to you. If the site offers drywall patching, roofing or full remodels, make sure your license covers them or remove them.

**Don’t say “bonded.”** The same guidelines say the law prevents you from noting in your advertising “that you are bonded,” because it could lead a consumer to think bonding offers more protection than it does. Many electrician sites still carry a “Licensed, Bonded and Insured” badge. In California, change it to “Licensed and insured,” and only if both are true.

**No false or misleading claims.** The CSLB notes it is a misdemeanor to use false, misleading or deceptive advertising to induce someone into an improvement contract. Claims like “San Diego’s #1 electrician” or “lowest prices in the county” are the kind of statements you would need to prove.

![Rows of white circuit breakers and terminal blocks inside an open electrical panel, with neatly run red, blue and green wires](https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=1200&q=75)

## What do C-10 and electrician certification mean for your site?

The C-10 classification is the CSLB license for this trade. In the CSLB’s words, an electrical contractor “places, installs, erects or connects any electrical wires, fixtures, appliances, apparatus, raceways, conduits, solar photovoltaic cells or any part thereof” that generate, transmit, transform or use electrical energy ([C-10 classification](${CSLB_C10})). That wording includes solar photovoltaic work, which matters in San Diego.

California also certifies the people doing the work. The Department of Industrial Relations explains that “existing law requires that persons performing work as electrician under a C-10 licensed contractor be certified” under standards set by the Division of Labor Standards Enforcement ([DIR Electrician Certification](${DIR_ECU})).

A website can turn both into trust signals, as long as every word is true:

- “Our electricians are state-certified” on the about page, if every person doing electrical work for you holds a current certification.
- Each team member’s certification type on their profile, if they’re happy to be named.
- A short paragraph explaining what certification means, for homeowners comparing you with someone who isn’t licensed.

## Why does the $1,000 handyman rule matter for your website?

Because your customers are comparing you with people who aren’t licensed. Since January 1, 2025, the minor work exemption is $1,000, up from $500, with conditions: the CSLB says “the work cannot require a permit, and the unlicensed person cannot employ anyone.” Unlicensed people may advertise work up to $1,000 only if they disclose in the ad that they are not licensed ([CSLB Bulletin 24-07](${CSLB_MINOR})).

Most electrical jobs a homeowner would search for need a permit. The City of San Diego says an electrical permit “is required for all electrical work, including Electric Vehicle Charging Systems” ([City electrical permits](${SD_ELEC})). So a “cheap handyman” who installs an EV charger or adds a circuit isn’t covered by the minor work exemption. A page titled something like “Do I need a licensed electrician for this?” that explains the $1,000 rule and the permit requirement with those links helps homeowners make a safe choice, and the honest answer happens to favor a licensed contractor.

## Which San Diego jobs deserve their own page?

The ones customers search for by name and that come with real local rules. Each page below should say what the job involves, what the permit process looks like, what the customer needs to decide, and what your own process is.

### Home EV chargers

The City’s Simple (No-Plan) Electrical Permit covers “electric vehicle charging stations for a private garage,” along with added circuits and miscellaneous wiring, and applicants “receive their permit normally within two business days” ([Simple No-Plan Permit](${SD_SIMPLE})). The City’s information bulletin on EV charging adds that chargers in a residential private garage for single dwellings, duplexes or townhouses “do not require plan review” ([IB 187](${SD_IB187})).

Your EV charger page can walk a homeowner through it: a quick look at the panel’s capacity, choosing a charger and location, the permit, the installation and the inspection. Say plainly whether you pull the permit (most customers expect you to), and that a charger in a condo or apartment garage usually needs more than a single-family install.

![A charging cable plugged into the port of a dark gray electric car, the connector ring glowing blue](https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?auto=format&fit=crop&w=1200&q=75)

### Rooftop solar, batteries and panel upgrades

For qualifying residential rooftop systems, the City says the solar permit “will be self-issued with no plan review” when the system does not exceed 38.4 kW AC and other conditions are met. The same permit may include “a panel upgrade of up to 320 amps,” an energy storage system “of up to 38.4 kWh, with each unit not exceeding 20 kWh,” and an inverter-integrated EV charger ([City solar PV permit](${SD_SOLAR})).

The utility side matters just as much. SDG&E treats anyone interconnecting generation or storage, “whether that is a homeowner, the homeowner’s energy contractor, or a third-party developer,” as an interconnection customer ([SDG&E customer generation](${SDGE_GEN})). SDG&E also notes that in December 2022 the CPUC modernized the rooftop solar program “in part by incentivizing solar paired with battery storage,” which created the Solar Billing Plan ([SDG&E Solar Billing Plan](${SDGE_SBP})). That is why so many San Diego homeowners now ask about adding a battery to an existing system, and why a page on battery retrofits and the panel work they need is worth writing.

If a job needs more capacity from the utility, SDG&E handles service work for solar, EV chargers and ADUs through its online [My Project Center](${SDGE_PROJECTS}). Explain who starts that request, your company or the homeowner, and roughly what happens next.

![A worker in jeans and a gray shirt lifting a black solar panel into place on a shingled roof under a clear blue sky](https://images.unsplash.com/photo-1624397640148-949b1732bb0a?auto=format&fit=crop&w=1200&q=75)

### Backup power for outages and planned shutoffs

SDG&E explains that “during extreme fire weather, we may temporarily turn off power in certain areas,” which it calls a Public Safety Power Shutoff ([SDG&E PSPS](${SDGE_PSPS})). Homeowners in the backcountry and fire-prone neighborhoods plan for it.

SDG&E’s generator guidance is direct: standby generators “require professional installation from a licensed electrician,” and “all generators installed with an Auto Transfer Switch require a Backup Generator Application submitted to SDG&E for review and approval” ([SDG&E generator safety](${SDGE_GENERATORS})). A backup power page that compares a standby generator with a home battery, explains the transfer switch and the utility application, and says which one you install, is exactly the kind of page a worried homeowner reads to the end.

### Electric-ready homes and the energy code

California’s 2022 Energy Code, in force since January 1, 2023, added requirements for new homes such as “electrical circuits for space heating, water heating, cooking/ovens, and clothes dryers” and an “electrical panel, branch circuits, and transfer switch for battery storage” ([2022 Energy Code summary](${CEC_2022})). The 2025 Energy Code took effect on January 1, 2026 and, among other changes, encourages heat pumps in new single-family homes ([2025 Energy Code summary](${CEC_2025})). If you work with builders or on ADUs, a page on what these requirements mean for wiring and panels shows you know the current code.

## City or County: which permit office covers your customer?

This is a San Diego detail many websites get wrong. The City of San Diego’s Development Services Department issues permits inside city limits. Unincorporated communities are served by the County, whose guide to home EV chargers says residents can use its online portal “to receive same-day permits for home chargers,” and tells residents of a city to “use the appropriate permit provided by the city you live in” ([County EV charger permits](${COUNTY_EV})). The region’s other cities have their own building departments.

You can turn that into one genuinely useful service-area page: list the areas you cover, note which permit office handles each, and say that you handle the permit either way. That is far more helpful than a dozen near-identical pages that swap in a town name, which Google’s spam policies treat as doorway pages: “multiple domain names or pages targeted at specific regions or cities that funnel users to one page” ([spam policies](${SPAM})). Write a separate page for a community only when you have something real to say about it, such as the fire-season backup power questions you hear from customers there.

## Should a San Diego electrician’s site be in Spanish?

If someone on your team can serve Spanish-speaking customers, yes. The Census Bureau’s 2020 to 2024 estimates put the share of San Diegans age 5 and older who speak a language other than English at home at 39.0%, and 25.1% were born outside the United States ([Census QuickFacts, San Diego](${CENSUS_SD})).

Do it properly: translate the pages that drive calls, such as your top services, the request form and the contact page, with a fluent person checking electrical terms. Say who speaks Spanish when someone calls. Keep your license number on every translated page, since it is advertising too. And link each Spanish page to its English version so Google can show the right one ([localized versions](${HREFLANG})).

## Owners, renters and property managers

San Diego is a city of renters as well as owners. QuickFacts puts the owner-occupied housing rate at 47.3% ([Census QuickFacts, San Diego](${CENSUS_SD})). That changes who calls. A tenant whose breaker keeps tripping can’t authorize a panel upgrade, and a property manager with forty units wants fast scheduling and clean invoices.

Make the request form ask whether the person owns, rents or manages the property, and consider a short page for landlords and property managers that explains how you schedule access, report findings and bill. It shows customers you understand their situation and saves you a wasted trip.

## Google Business Profile and Local Services Ads

Most electricians work at the customer’s home, which makes them a service-area business. Google says, “If you don’t serve customers at your business address, remove your address from your Business Profile,” and that service-area businesses “can only have one profile for the whole area that they serve” ([service areas](${SERVICE_AREAS})). Keep the website’s service-area page and the profile’s service areas in step.

If you run Local Services Ads, electricians are one of the listed categories, and the requirements include acknowledging “possession of all appropriate business licenses” ([Local Services Ads](${LSA_START})). The license number on your website is one more place a customer can confirm what the ad says.

## Structured data for an electrician

Schema.org has a specific Electrician type, a kind of local business ([schema.org/Electrician](${SCHEMA_ELECTRICIAN})). Describe the business with it, including name, phone, hours and service area, and make sure every value matches what the page shows. Google’s [local business structured data](${LOCAL_SD}) documentation explains which properties it reads.

## A checklist before your San Diego electrician site goes live

1. CSLB license number on every page, beside the phone number, under the exact licensed business name.
2. Only services your classification covers; nothing that implies other trades you aren’t licensed for.
3. No “bonded” claim; “licensed and insured” only if both are true.
4. Certification claims only where every electrician doing the work is certified.
5. A page each for EV chargers, solar and battery work, panel upgrades and backup power, each with the City, County or SDG&E link it relies on.
6. One honest service-area page that says which permit office covers which areas.
7. A request form that asks the ZIP code, own, rent or manage, and how urgent the job is.
8. Spanish pages only if your team can serve Spanish speakers, each linked to its English version.
9. Business Profile set up as a service-area business, matching the website.
10. Electrician structured data that matches the page.
11. A mobile [speed test](${PAGESPEED}) of the home page comes back fast.

## How SaySites helps San Diego electricians

A SaySites electrician site comes with the pieces this guide asks for: one page per service (EV chargers, panel upgrades and backup power can each have their own), a page listing the areas you serve, a call button visitors can tap on a phone, and a request form on every page. Search engines read the business as an Electrician from its structured data, and nothing is published until the page clears a 95+ speed check. Each request is filed in your leads pipeline, where you can call or text the customer, keep notes and mark the job won, and the form can collect the job’s ZIP code and whether the customer owns or rents. To update the site, you type what you want, like “show our CSLB license number beside the phone number on every page,” then check the draft and publish it. SaySites adds no license, certification, photo or review you didn’t give it.

It runs on the Site plan, $15 a month with hosting included ([websites for electricians](/websites-for/electricians), [pricing](/pricing)). You can [request a free redesign](/redesign) of your current site to compare, or [start a 7-day free trial](/signup) and publish your EV charger page this week. Two related guides: [no storefront? How to show Google where you work](/blog/service-area-business-google) and [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).`,
    faq: [
      { q: 'Does a California electrician have to put a license number on their website?', a: 'Yes. The CSLB says licensed contractors must include their license number in all forms of advertising, and it counts any website or post that solicits business on the Internet as advertising. The civil penalty for a first offense is between $100 and $1,000. Show the number beside your phone number on every page.' },
      { q: 'Can a San Diego electrician say “licensed, bonded and insured”?', a: 'Not the “bonded” part. The CSLB says the law prevents contractors from noting in their advertising that they are bonded, because it could make consumers think a bond protects them more than it does. “Licensed and insured” is fine if both are true, with your CSLB license number shown next to it.' },
      { q: 'Do I need a permit to install a home EV charger in San Diego?', a: 'Yes. The City of San Diego requires an electrical permit for all electrical work, including EV charging systems. A charger in a private garage of a single-family home, duplex or townhouse can use the Simple No-Plan Electrical Permit, usually issued within two business days. Unincorporated areas use the County’s permit portal instead.' },
      { q: 'Can a handyman do electrical work in California without a license?', a: 'Only minor work. Since January 1, 2025, unlicensed people may take jobs under $1,000, but only if the work needs no permit and they employ no one, and their ads must say they are not licensed. Most electrical jobs, such as EV chargers and new circuits, need a permit, so a licensed contractor is required.' },
      { q: 'What should a San Diego electrician’s website include?', a: 'Your CSLB license number on every page, a tap-to-call number, a request form, and a page for each main job: EV chargers, solar and battery work, panel upgrades and backup power. Add one service-area page that says which permit office covers which areas, and Spanish pages if your team serves Spanish speakers.' },
      { q: 'Does a backup generator in San Diego need SDG&E approval?', a: 'If it uses an automatic transfer switch, yes. SDG&E says all generators installed with an Auto Transfer Switch need a Backup Generator Application submitted for its review and approval, and that standby generators require professional installation by a licensed electrician. A backup power page on your site can explain both steps.' },
      { q: 'How much does a SaySites electrician website cost?', a: 'The Site plan is $15 a month with hosting included and a 7-day free trial. It includes a page per service, a service-area page, tap-to-call, a request form on every page, a leads pipeline and Electrician structured data. You can also send your current site for a free redesign and see it rebuilt first.' },
    ],
    about: ['California contractor licensing', 'Electrician websites', 'EV charger installation', 'San Diego, California'],
    published: '2026-10-16',
    status: 'published',
  },
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
    slug: 'chicago-law-firm-website-design',
    title: 'Chicago Law Firm Website Design: Illinois Ad Rules',
    description: 'What a Chicago law firm website must include under Illinois Rules 7.1 to 7.5, the 2025 lead generator rule, and how Cook County clients search for a lawyer.',
    kind: 'guide',
    summary: [
      'Illinois Rule 7.2(a) requires the name and office address of at least one lawyer or firm responsible for the content, so a Chicago firm site should carry it on every page.',
      'Illinois bars lawyers from calling themselves “certified,” “specialist” or “expert” except to identify a real certificate or award, and then a set statement from Rule 7.4(c) is required.',
      'Since July 1, 2025, paying a directory, matching site or lead generator is allowed only through Rule 7.2(c), with disclosures and written verification from the service.',
      'Illinois has no ad filing requirement in Rules 7.1 to 7.5, but targeted emails to people with a known legal matter must say “Advertising Material” at the start and end.',
      'Cook County has about 400 judges across ten divisions and six municipal districts, so pages built around a specific courthouse and problem serve clients better than a list of practice areas.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown Chicago’s towers at sunset with Lake Michigan stretching to the horizon' },
    body: `A Chicago law firm website has to follow the Illinois Rules of Professional Conduct, Rules 7.1 through 7.5, which the Illinois Supreme Court publishes and the ARDC enforces. The short version: put the name and office address of a responsible lawyer or firm on the site, keep every statement free of unjustified expectations, never describe a lawyer as a “specialist” or “expert” unless you are naming a specific certificate or award and adding the statement Rule 7.4(c) requires, and check any directory or lead service you pay against the intermediary connecting service rule that took effect on July 1, 2025. Illinois does not make you file your website with anyone, which puts the whole job of compliance on the firm. After that, build the site for how Cook County residents actually look for help: by legal problem, by courthouse and on a phone.

This guide quotes each Illinois rule from the Supreme Court’s own text, with links, then covers the Cook County court landscape, the language mix of Chicago’s clients, Google Business Profile limits for city offices, AI chat tools on firm sites, and a launch checklist. It is general information, not legal or ethics advice. The ISBA and the ARDC both answer ethics questions from Illinois lawyers, and the opinions cited below show how they have read these rules.

## What does Illinois require on a law firm website?

One line of identification and a lot of care. Rule 7.2(a) lets a lawyer advertise through written, recorded or electronic communication, and adds: “Any communication made pursuant to this paragraph shall include the name and office address of at least one lawyer or law firm responsible for its content” ([Illinois Rule 7.2](${IL_72})).

Because Google can send a visitor straight to a practice area page, a blog post or an attorney bio, each of those pages is the advertisement for that visitor. The practical answer is a footer on every page with the firm’s name and its office street address, or the responsible lawyer’s name and office address. A Loop firm with a second office in Schaumburg can list both, as long as each address is a real office.

The comments to Rule 7.2 also say what kind of information belongs on a firm site. Comment 2 describes permitted content that includes a lawyer’s name, address, “email address, website,” fields of practice, fees and payment terms, and “a lawyer’s foreign language ability” ([Rule 7.2 comments](${IL_72})). That last item matters in a city where many clients prefer to talk about a legal problem in Spanish, Polish, Arabic or another language. If a lawyer at the firm speaks it, say so on that lawyer’s profile.

The ISBA reached the same conclusion about websites years ago. Opinion 96-10 says a lawyer website “is not ‘communication directed to a specific recipient’” and that “only the general rules governing communications concerning a lawyer’s services and advertising should apply” ([ISBA Op. 96-10](${ISBA_9610})). In other words, the site is advertising, not solicitation, so Rules 7.1 and 7.2 are the ones that govern it.

## Does an Illinois firm have to file its website with the ARDC?

No. None of Rules 7.1 through 7.5 contains a filing, pre-approval or fee requirement for advertising ([Article VIII index](${IL_ART8})). That is a real difference from states such as Texas or Florida, where firms file certain ads with the state bar.

It cuts both ways. There is no review committee to catch a risky headline before launch, and no advisory approval to rely on afterward. If a complaint reaches the ARDC, the question is simply whether the page was false or misleading when it was published. For that reason, Illinois firms do well to keep their own record: a dated copy of each version of the home page and results page, who approved it, and where every factual claim came from. Rule 7.2 does not require you to keep copies, but a record answers questions later.

## What can’t a Chicago law firm website say?

Rule 7.1 is short: “A lawyer shall not make a false or misleading communication about the lawyer or the lawyer’s services.” A statement is misleading if it “contains a material misrepresentation of fact or law, or omits a fact necessary to make the statement considered as a whole not materially misleading” ([Illinois Rule 7.1](${IL_71})). The comments explain where firm websites usually go wrong.

### True statements that still mislead

Comment 2 says even a truthful statement is misleading if there is “a substantial likelihood that it will lead a reasonable person to formulate a specific conclusion about the lawyer or the lawyer’s services for which there is no reasonable factual foundation.” A homepage banner that says “Chicago’s top trial lawyers” invites exactly that conclusion. Who decided they were the top, and on what basis? If you cannot answer that on the page, cut the line.

### Case results

Comment 3 covers results. Truthful reports of past wins “may be misleading if presented so as to lead a reasonable person to form an unjustified expectation that the same results could be obtained for other clients in similar matters without reference to the specific factual and legal circumstances of each client’s case.” The same comment notes that “the inclusion of an appropriate disclaimer or qualifying language may preclude a finding that a statement is likely to create unjustified expectations” ([Rule 7.1, Comment 3](${IL_71})).

A results page that holds up well in Illinois gives each result enough context to stand on its own: the kind of case, the court or forum, whether it was a verdict or a settlement, and a qualifier placed right next to the figures. Comment 3 also warns about an “unsubstantiated comparison” of a lawyer’s services or fees with other lawyers’. “Lower fees than any firm in Chicago” is a comparison you would need to prove.

### Firm names, trade names and web addresses

Illinois still keeps firm names in a separate Rule 7.5. A lawyer in private practice may use a trade name “if it does not imply a connection with a government agency or with a public or charitable legal services organization and is not otherwise in violation of Rule 7.1.” Rule 7.5(d) adds that lawyers may imply they practice in a partnership or other organization “only when that is the fact” ([Illinois Rule 7.5](${IL_75})).

Comment 1 confirms a firm “may also be designated by a distinctive website address,” and warns that a name with a geographic term, its example being “Springfield Legal Clinic,” may need an express disclaimer that the firm is not a public legal aid agency. Before buying a domain like “chicagotenantrights” or “cookcountyinjuryhelp,” ask whether a reasonable visitor might think it is a public service. If so, pick another name or carry the disclaimer.

Titles on attorney pages count too. The ISBA said in Opinion 24-02 that “of counsel,” “counsel,” “senior counsel” and “special counsel” are proper for a lawyer with a “close, regular, and personal relationship” with the firm ([ISBA Op. 24-02](${ISBA_2402})). List a lawyer that way only when the relationship fits.

![The Picasso sculpture in Chicago’s Daley Plaza, with flags flying and the Chicago Temple’s spire rising behind it](https://images.unsplash.com/photo-1780937792102-acfa87199ada?auto=format&fit=crop&w=1200&q=75)

## Can an Illinois lawyer say “specialist” or “expert” on a website?

Only in a narrow way, and this is where many Chicago sites slip. Rule 7.4(b) states: “The Supreme Court of Illinois does not recognize certifications of specialties in the practice of law, nor does it recognize certifications of expertise in any phase of the practice of law by any agency, governmental or private, or by any group, organization or association.” The one listed exception is that a lawyer admitted before the U.S. Patent and Trademark Office may use the designation “Patent Attorney” ([Illinois Rule 7.4](${IL_74})).

Rule 7.4(c) then says that, except when identifying certificates, awards or recognitions issued to the lawyer, “a lawyer may not use the terms ‘certified,’ ‘specialist,’ ‘expert,’ or any other, similar terms to describe his qualifications.” When the lawyer does name a certificate, award or recognition, the reference must be truthful and verifiable, and it must state that the Supreme Court of Illinois does not recognize certifications of specialties in the practice of law and that the certificate, award or recognition is not a requirement to practice law in Illinois.

Here is how that plays out on a typical profile page:

- **Not allowed:** “Maria is a DUI expert.” “Our workers’ compensation specialists.” “Certified divorce attorneys.”
- **Allowed:** “Maria’s practice is limited to DUI and traffic defense.” Comment 1 to Rule 7.4 permits statements such as practicing only in certain fields.
- **Allowed with the statement:** “Board certified in civil trial advocacy by [the certifying organization],” followed by the Rule 7.4(c) statement, placed beside the credential rather than in a distant footer.

The same applies to award badges. A peer-review or magazine recognition shown on the home page is a recognition issued to the lawyer, so it needs to be truthful, verifiable and accompanied by the Illinois statement. Many firms find it simpler to show such badges only on the lawyer’s own profile, with the statement directly underneath.

## How does the 2025 rule change affect directories and lead generators?

This is the newest part of the Illinois rules, and it reaches beyond the firm’s own site. Rule 7.2(b) keeps the general ban: “A lawyer shall not give anything of value to a person for recommending the lawyer’s services.” On April 1, 2025, the Supreme Court added Rule 7.2(c), effective July 1, 2025, which allows a lawyer to “accept a connection of a potential client through, and/or pay the usual charges of, an intermediary connecting service (ICS),” subject to conditions ([Rule 7.2](${IL_72}); [Supreme Court announcement](${IL_ICS_NEWS})).

Comment 6 defines the term broadly: an ICS includes “a lawyer directory, referral service, matching service, bidding site, question-and-answer site, lead generator, or similar marketplace.” Under 7.2(c), the lawyer must disclose the relationship and any connecting or advertising fees, and must take “reasonable steps, such as obtaining written verification from the ICS” that the service meets a list of conditions. Among them, the service may not make false or misleading statements, must make any rating criteria publicly available, and, apart from bar association and legal aid services, its fees may not be contingent on the outcome or calculated as a percentage of legal fees. Comment 8 points to a sample ICS certification letter in the Article VIII forms appendix and describes the due diligence as initial and annual.

What does that mean for your website project?

1. **Your web designer is not an ICS.** Comment 5 says a lawyer may pay for directory listings, domain registrations and internet advertising, and may pay vendors who provide marketing services, naming “website designers” among them.
2. **Paid placement on a marketplace is.** If the firm buys leads, pays a matching site or takes cases from a question-and-answer platform, get the written verification on file before the first lead, then renew it each year.
3. **Disclose it.** If your site mentions a directory profile or rating, check what the ICS rules require you to tell the client about the relationship and the fees.

The ISBA has already applied the rules to marketplaces. Opinion 22-02 found that a for-profit matching service may comply if matches are automated, the service “does not endorse or vouch for the lawyer’s services,” and the fees are reasonable and unrelated to the legal services provided ([ISBA Op. 22-02](${ISBA_2202})). Opinion 25-02 found that a lawyer would violate the rules by taking clients from a for-profit referral service that offers a “money-back guarantee” or fails to disclose that it uses non-attorney actors in its ads ([ISBA Op. 25-02](${ISBA_2502})).

Not sure your current site would hold up? Send its address for a [free redesign](/redesign) and you’ll see your own pages rebuilt with the responsible-firm footer and plain fields-of-practice wording in place, with no cost and no commitment.

## When does Illinois require “Advertising Material”?

Not on the website itself, but on some of what you send after it. Comment 1 to Rule 7.3 says a communication is typically not a solicitation if it is directed to the general public, “such as through a billboard, an Internet banner advertisement, a website or a television commercial,” or if it responds to a request for information or is “automatically generated in response to Internet searches” ([Illinois Rule 7.3](${IL_73})).

Targeted messages are different. Rule 7.3(c) requires every written, recorded or electronic solicitation to anyone “known to be in need of legal services in a particular matter” to include the words “Advertising Material” on the outside envelope, if any, “and at the beginning and ending of any recorded or electronic communication.” The ISBA has said the exact words matter: in Opinion 12-04, a solicitation labeled “promotional materials” did not comply ([ISBA Op. 12-04](${ISBA_1204})).

Rule 7.3(a) also bars live solicitation, in person, by live phone or by real-time electronic contact, when a significant motive is the lawyer’s pecuniary gain, with exceptions for other lawyers and people with a family, close personal or prior professional relationship. Illinois adds one more limit of its own in Rule 7.3(b)(3): no solicitation of a respondent in an ex parte protective order case before the respondent has been served.

For a firm website, that means:

- A visitor who fills out your form has asked for information, so a reply to them is not a solicitation.
- A drip campaign to people the firm knows have a pending matter, such as recent defendants or foreclosure filings, needs “Advertising Material” at the beginning and end of each email.
- A chat window that pops up and starts selling to a visitor is real-time electronic contact. Keep chat reactive: it answers the visitor’s own questions and offers a consultation, nothing more.

## How do Cook County clients look for a lawyer?

By problem and by place, and in Cook County the place can be one of many courthouses. The Circuit Court of Cook County describes itself as the largest of the 24 judicial circuits in Illinois and “one of the largest unified court systems in the world,” with about 400 judges serving 5.2 million residents in Chicago and 126 suburbs, and more than 1 million cases filed each year. It is organized into ten divisions and six geographic districts: the First Municipal District covers the City of Chicago, and the others sit in Skokie, Rolling Meadows, Maywood, Bridgeview and Markham ([Circuit Court of Cook County](${COOK_ORG})). The First District’s main location is the Richard J. Daley Center at 50 W. Washington Street ([First Municipal District](${COOK_FIRST})). Federal cases in the Eastern Division of the Northern District of Illinois are heard at the Dirksen U.S. Courthouse, 219 South Dearborn Street ([N.D. Illinois](${ILND})).

Competition is dense. The ARDC’s 2025 annual report counts 47,089 lawyers with a principal business address in Cook County, 71.8% of all lawyers based in Illinois ([ARDC Annual Report 2025](${ARDC_2025})). A homepage that lists twenty practice areas says nothing a client can’t find on thousands of other sites.

Pages that explain a real step in a real courthouse, written from the firm’s own experience, are much harder to replace. A few that suit Chicago practices:

- **Traffic and misdemeanor defense:** which suburban district courthouse a ticket from a particular suburb is likely heard in, what happens at the first appearance, and what to bring.
- **Family law:** how a first court date works in the Domestic Relations Division at the Daley Center, and what clients can do to prepare.
- **Landlord and tenant:** the eviction process from the tenant’s or the landlord’s side, linked to the court’s own forms and instructions.
- **Personal injury:** what to do in the weeks after a crash on the Kennedy or the Dan Ryan, how your contingent fee and expenses work, and how long cases in the Law Division tend to take in your experience.

Google’s guidance on [helpful, people-first content](${HELPFUL}) asks whether a page shows first-hand expertise and leaves the reader feeling they learned enough. A page like these does both, and it is the kind of clear, specific passage an AI answer can quote.

![Two people at a desk reviewing papers as one signs a document](https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=75)

## Should a Chicago firm’s website be in more than one language?

If the firm can serve those clients, often yes. Census Bureau figures for 2020 to 2024 show that 35.4% of Chicago residents age 5 and older speak a language other than English at home, and 20.9% of residents were born outside the United States ([Census QuickFacts, Chicago and Cook County](${CENSUS_CHI_COOK})).

Illinois treats foreign language ability as permitted advertising content (Rule 7.2, Comment 2), and the rest of the rules apply unchanged to every translated page. In practice:

- Say exactly who speaks the language: a named attorney, a paralegal or the intake team. A client who wants to speak to the lawyer directly needs to know.
- Have a fluent speaker who knows legal vocabulary review each page, including any results qualifier and the Rule 7.4(c) statement if a credential appears.
- Link each translated page to its English version so Google can show the right one to each searcher ([localized versions](${HREFLANG})).
- Translate the pages people actually need, such as a practice area, the consultation page and office details, rather than machine-translating the entire site.

## Google Business Profile for Chicago law offices

Google lists lawyers among individual practitioners, allows titles such as JD or Esq. in a practitioner’s profile, and says “a practitioner shouldn’t have multiple Business Profiles to cover all of their specializations” ([Business Profile guidelines](${GBP_GUIDELINES})). Where several lawyers share an office, the firm creates its own profile for that location.

Two rules catch Chicago firms in particular. Google says a virtual office, a rented mailing address the business doesn’t operate from, “isn’t eligible for a Business Profile,” and a co-working office qualifies only with clear signage and staff during business hours. A firm based in the Loop that rents a suburban mailbox to show up in Oak Park or Naperville searches is outside the guidelines.

The same thinking applies to the website. Google’s spam policies name “multiple domain names or pages targeted at specific regions or cities that funnel users to one page” as doorway abuse ([spam policies](${SPAM})). Build an office page for each office you staff, with its own address and directions, and write about a suburb only when you have something specific to say about its courthouse or its clients. Our guide to [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) explains how relevance, distance and prominence shape the map results.

## Can a Chicago firm use an AI chat assistant on its site?

It can, with the same duties that apply to any other tool. The Illinois Supreme Court’s Policy on Artificial Intelligence, effective January 1, 2025, says use of AI by attorneys “may be expected, should not be discouraged, and is authorized provided it complies with legal and ethical standards,” and that the Rules of Professional Conduct “apply fully to the use of AI technologies” ([Illinois Supreme Court AI Policy](${IL_AI_POLICY})). The ARDC adds that the policy authorizes AI use so long as duties of competence, confidentiality, supervision and candor are met, and it publishes a nonbinding guide with sample policies and notices ([ARDC on AI](${ARDC_AI})).

For a website chat tool, that comes down to a few questions. Does it tell visitors not to share confidential details before a conflict check? Does it avoid giving legal advice or predicting outcomes? Does a lawyer review what it says, the same way they would review the rest of the site? A chat window that makes a misleading statement is a misleading communication under Rule 7.1, no matter who typed it.

## A launch checklist for a Chicago law firm website

1. Name and office address of a responsible lawyer or firm on every page (Rule 7.2(a)).
2. No “specialist,” “expert” or “certified” except to name a real certificate or award, with the Rule 7.4(c) statement beside it.
3. Results show the type of case, the forum and verdict or settlement, with a qualifier next to the figures.
4. No unprovable comparisons or superlatives.
5. Trade name and domain don’t suggest a government or legal aid connection; “of counsel” and partnership claims are accurate.
6. Every paid directory, matching site or lead source has written ICS verification on file, renewed yearly, with required disclosures made.
7. Follow-up emails to people with a known matter carry “Advertising Material” at the start and end; chat stays reactive.
8. Translated pages name who speaks the language and link to their English versions.
9. One Business Profile per staffed office, no virtual offices, and matching details on each office page.
10. Dated copies of each version of the home and results pages, with who approved them.
11. Structured data matches what each page shows ([local business structured data](${LOCAL_SD})).

## How SaySites builds Chicago law firm websites

SaySites law firm sites start with the structure this guide describes: a page for each practice area, attorney profiles, an office page for each location, and a consultation form on every page whose intake questions include the other party’s name for a conflict check. The firm is described to search engines as a LegalService, attorneys as people and practice areas as services, and every page must pass a 95+ speed check before it goes live. Nothing is invented. Results, credentials and languages appear only when you supply them, and you change anything by saying it in plain words, such as “replace ‘DUI expert’ with ‘practice limited to DUI defense,’” then review the change as a draft before you publish.

The Law Firm Starter plan is $79 a month ([websites for law firms](/websites-for/law-firms), [pricing](/pricing)). Already have a site? [Get a free redesign](/redesign) and see your own pages rebuilt first, or [start a 7-day free trial](/signup) and build it yourself this week. Firms with offices in more than one state can compare our guides to [Houston law firm websites under the Texas rules](/blog/houston-law-firm-website-design) and [New York law firm websites after the 2026 changes](/blog/new-york-law-firm-website-rules).`,
    faq: [
      { q: 'What must an Illinois law firm website include?', a: 'Illinois Rule 7.2(a) says any advertising communication must include the name and office address of at least one lawyer or law firm responsible for its content. Since visitors can land on any page from a search, the simplest approach is a footer on every page with the firm’s name and the street address of a real office, plus the responsible lawyer if you prefer.' },
      { q: 'Do Illinois lawyers have to file website ads with the ARDC?', a: 'No. Illinois Rules 7.1 through 7.5 contain no filing, pre-approval or fee requirement for advertising, unlike some states. That means no committee reviews your site before launch, so the firm carries the whole responsibility. Keeping dated copies of each home page and results page, with who approved them, is a sensible habit.' },
      { q: 'Can a Chicago lawyer call themselves a specialist?', a: 'Not as a general description. Rule 7.4(c) bars the words certified, specialist and expert except when identifying a certificate, award or recognition actually issued to the lawyer. Then the reference must be truthful and verifiable and must state that the Supreme Court of Illinois does not recognize certifications of specialties and that the credential is not required to practice law in Illinois.' },
      { q: 'Can my firm pay a lead generator or legal directory in Illinois?', a: 'Yes, under Rule 7.2(c), effective July 1, 2025, if the service qualifies as an intermediary connecting service and meets the rule’s conditions. You must disclose the relationship and fees, and take reasonable steps such as getting written verification from the service. Fees generally cannot be contingent on outcomes or a percentage of legal fees.' },
      { q: 'When do Illinois law firm emails need “Advertising Material”?', a: 'When they are targeted solicitations. Rule 7.3(c) requires the words Advertising Material at the beginning and end of electronic communications sent to someone known to need legal services in a particular matter. A website and a reply to someone who contacted you first are not solicitations, and the ISBA has said other labels do not satisfy the rule.' },
      { q: 'Should a Chicago law firm website be in Spanish or other languages?', a: 'If someone at the firm can serve those clients, it often helps. Census figures show 35.4% of Chicago residents age 5 and older speak a language other than English at home. Illinois lists foreign language ability as permitted advertising content. Name who speaks each language, have a fluent reviewer check every page, and link each version to its English page.' },
      { q: 'Can a Chicago firm list a suburban mailbox on Google Business Profile?', a: 'No. Google’s Business Profile guidelines say a virtual office, a rented address the business doesn’t operate from, isn’t eligible, and co-working spaces qualify only with signage and staff during business hours. Create a profile for each office you actually staff, and keep the website’s office pages matched to those profiles.' },
      { q: 'What does a SaySites law firm website cost?', a: 'The Law Firm Starter plan is $79 a month with a 7-day free trial. It includes practice area pages, attorney profiles, office pages, a consultation form with a conflict check question, LegalService structured data and hosting. You can also send your current site for a free redesign and see your own pages rebuilt before you decide.' },
    ],
    about: ['Illinois Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'Chicago, Illinois'],
    published: '2026-10-15',
    status: 'published',
  },
  {
    slug: 'dallas-med-spa-website-design',
    title: 'Dallas Med Spa Websites: Texas Ad and Delegation Rules',
    description: 'What a Dallas med spa website should show under Texas Medical Board ad rules, the 2025 IV therapy law and laser hair removal licensing, before you launch.',
    kind: 'guide',
    summary: [
      'Texas Medical Board rule 164.3 treats unlabeled models, undisclosed paid testimonials and unproven “exclusive” skill claims as misleading, and physicians answer for every ad.',
      'A med spa where care is delivered under standing orders away from the physician’s main practice must disclose the medical directorship, supervision or delegation in its ads.',
      'Patients must consent before their photos appear in any advertising, and physicians keep a copy of each ad for two years.',
      'Since September 1, 2025, Jenifer’s Law (Occupations Code chapter 172) sets who may order and give elective IV therapy, so IV pages should name the professionals involved.',
      'Laser hair removal facilities that aren’t physician-owned need a TDLR license, and their ads may not call the treatment risk-free or medically beneficial.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1631660975301-b2b65e80c98a?auto=format&fit=crop&w=1600&q=75', alt: 'Dallas skyline at dusk with Reunion Tower lit up, reflected in a still pond' },
    body: `A Dallas med spa website is a medical advertisement in the eyes of Texas law, so it has to meet the Texas Medical Board’s advertising rules before it worries about design. In short: every claim must be true and checkable, models must be labeled as models, testimonials need a credentials disclaimer and a disclosure of any compensation, patients must consent before their photos are used, and if treatments happen under a physician’s standing orders away from that physician’s main practice, the site must disclose the medical directorship or delegation. Add the 2025 rules for elective IV therapy and the separate licensing rules for laser hair removal, and you have the checklist a Dallas aesthetics practice should work through before launch. Then build the site for how clients really choose: one treatment at a time, by the person holding the syringe or the laser, on a phone.

This guide quotes the Texas Administrative Code and statutes directly, with links, and adds the federal rules on reviews, product claims and online tracking that also shape a med spa site. It is general information, not legal or medical advice. Because a med spa’s structure (who owns it, who supervises, who performs what) changes which rules apply, have a Texas health care attorney review your setup.

## Is a med spa website “advertising” under Texas rules?

Yes. The Texas Medical Board defines advertising as “any communication designed to attract attention to the practice of a physician” ([22 TAC § 164.1](${TX_164_1})). A treatment menu, a provider page and a seasonal offer all qualify. Rule 164.2 then makes each physician “responsible for the form and content of any advertisement” and deems the physician “to have reviewed and approved any and all advertisements” ([22 TAC § 164.2](${TX_164_2})).

That puts the medical director’s license behind every page, whether or not the physician wrote it. Two duties in the same rule matter for a website:

- **Photo consent.** Rule 164.2(b): “Patients must consent prior to any use of photographs or other representations in any advertising by a physician, practice, or entity.” Before and after galleries need written consent from each patient pictured, and the consent should cover the website and social media specifically.
- **Two-year records.** Rule 164.2(c): “A recording or copy of any advertisement shall be retained by the physician for a period of two years from the last date of communication.” For a website, that means dated copies of each page version, especially treatment pages, offers and galleries.

The statute is broader still. Texas Occupations Code section 101.201 says a person “may not use advertising that is false, misleading, deceptive, or not readily subject to verification,” and lists, among other things, advertising that “makes a representation likely to create an unjustified expectation about the results of a health care service or procedure” and advertising that “causes confusion or misunderstanding as to the credentials, education, or licensing of a health care professional” ([Occ. Code ch. 101](${OC_101})). The same list names advertising that “contains a testimonial.” Because the Board’s rules describe how a testimonial must be disclosed, as covered below, ask your attorney how the two fit before you put patient quotes on the site.

## What does Texas treat as misleading on a med spa site?

Rule 164.3 lists specific items the Board deems “false, deceptive, or misleading,” in addition to those in the statute ([22 TAC § 164.3](${TX_164_3})). The ones that come up most on aesthetics websites:

1. **Unlabeled models.** “Failing to explicitly identify individuals as models or actors instead of actual patients.” The glowing face in a stock hero image needs a caption such as “Model, not a patient.”
2. **Testimonials without disclosures.** “Providing a testimonial without: (A) a disclaimer or warning as to the credentials of the person making the testimonial; and (B) a disclosure of compensation provided in exchange for the testimonial.” A free treatment for a review is compensation.
3. **Cost claims.** “Untruthful or deceptive claims regarding costs and fees, including claims of free service if a third-party is billed.” A “free consultation” must actually be free.
4. **Unique skill.** “Claiming a unique or exclusive skill without substantiation.” Lines such as “the only injector in Dallas trained in this technique” need proof.
5. **Paid content.** “Failing to disclose that the advertisement, article, or infomercial is a ‘paid for’ presentation.” A sponsored feature reposted on your site should say so.
6. **Board wording.** Using “board eligible,” “board qualified” or similar language “calculated to convey the same meaning as ‘board certified.’”

Rule 164.4 limits “board certified” to physicians currently certified by a member board of the American Board of Medical Specialties, the AOA’s Bureau of Osteopathic Specialists, the American Board of Oral and Maxillofacial Surgery, or a board the TMB has approved ([22 TAC § 164.4](${TX_164_4})). If your medical director is board certified in dermatology or plastic surgery, name the board. If not, describe training and experience in plain terms instead.

## What must a Dallas med spa disclose about its medical director?

This is the rule written with med spas in mind. Rule 164.3(b)(8) makes it misleading to fail “to disclose medical directorship, supervision of, or delegation to non-physicians at a location that is not the physician’s primary practice location and where care is delivered pursuant to standing orders and protocols” ([22 TAC § 164.3](${TX_164_3})).

Many Dallas med spas fit that description exactly: a physician supervises from a practice elsewhere, while nurses and other trained staff perform injections, peels or laser treatments under written protocols. If that is your model, say so clearly on the website, for example on the About page and each treatment page: who the medical director is, that treatments are performed by named staff under the physician’s supervision and protocols, and how patients reach the physician.

The delegation rules themselves explain what to describe. Since January 9, 2025, the Board’s cosmetic delegation rules sit in 22 TAC chapter 169. Section 169.25 lists “nonsurgical medical cosmetic procedures, including but not limited to the injection of medication or substances for cosmetic purposes” and the use of a prescription medical device for cosmetic purposes among acts that can be delegated and supervised ([22 TAC § 169.25](${TX_169_25})). The old rule in chapter 193 was repealed, so older articles quoting section 193.17 are out of date ([repeal notice](${TX_193_17})).

Before a delegated procedure, section 169.26 requires a physician, PA or APRN to establish a practitioner-patient relationship, keep an adequate medical record, “disclose the identity and title of the individual who will perform the delegated act,” and make sure someone trained in basic life support is present. A physician, PA or APRN must be on site or “immediately available for emergency consultation in the event of an adverse outcome” ([22 TAC § 169.26](${TX_169_26})). Written orders must include the delegating physician’s identity, patient screening criteria and procedures for complications and emergencies ([22 TAC § 169.27](${TX_169_27})).

Section 169.28 adds posting rules for the spa itself: the Board’s complaint notice and the delegating physicians’ names and Texas license numbers in each public area and treatment room, and name tags that show each staff member’s identity and credentials ([22 TAC § 169.28](${TX_169_28})). The complaint notice rule, section 177.2, also says practices that offer telemedicine must show it through a prominent link on the provider website in at least 10-point readable type ([22 TAC § 177.2](${TX_177_2})).

A website that matches what the client sees in the treatment room builds trust. Put the same names, titles and credentials on your provider pages that appear on the name tags and posted notices.

![A gloved practitioner giving a client a facial treatment in a calm clinic room](https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=1200&q=75)

## What changed for IV therapy pages in 2025?

Texas passed HB 3749, known as Jenifer’s Law, which the Governor signed on June 20, 2025, effective September 1, 2025 ([bill history](${HB3749_HIST}); [enrolled text](${HB3749_TEXT})). It created Occupations Code chapter 172, “Provision of Elective Intravenous Therapy” ([Occ. Code ch. 172](${OC_172})).

The law defines elective IV therapy as a procedure to give fluids, nutrients, medications or blood through a vein that the patient seeks “to alleviate symptoms of temporary discomfort or improve temporary wellness,” and that is not given in a physician’s office or a licensed health facility. Section 172.051 then sets who may do what: a physician may delegate prescribing or ordering to a physician assistant or an advanced practice registered nurse acting under adequate physician supervision, and may delegate administering to a PA, an APRN or a registered nurse acting under adequate physician supervision.

For an IV hydration page, that gives you clear content to write:

- Who orders the drip (the physician, or a named PA or APRN under the physician’s supervision).
- Who places the IV and monitors the client (a named RN, PA or APRN).
- Who the supervising physician is, consistent with the directorship disclosure above.
- What the screening involves before a drip is started, described in your own practice’s terms.

Keep benefit claims modest. The Federal Trade Commission’s Endorsement Guides say “consumer endorsements themselves are not competent and reliable scientific evidence” ([16 CFR Part 255](${FTC_ENDORSE})), and the Texas statute bars representations likely to create unjustified expectations. “Fluids and electrolytes given by a registered nurse under our physician’s orders” is a description. “Boosts immunity and cures hangovers” is a claim you would need evidence for.

## Do laser hair removal pages need anything special?

If the facility isn’t owned by a physician, yes. In Texas, laser hair removal is licensed by the Texas Department of Licensing and Regulation ([TDLR laser hair removal](${TDLR_LAS})) under Health and Safety Code chapter 401, subchapter M ([H&S Code ch. 401](${HS_401})). Section 401.510 says a person “may not operate a laser hair removal facility unless the person holds a license,” with exemptions including a facility owned or operated by a physician for the practice of medicine. Technicians need the appropriate certificate under section 401.504, which does not apply to a physician or a physician’s delegate acting under chapter 157.

Section 401.518 is the advertising rule: a facility operator “may not claim, advertise, or distribute promotional materials that claim that laser hair removal is free from risk or provides any medical benefit,” and may not produce false or misleading advertising about its services. On the website, that rules out “painless and risk-free” and “medical-grade results.” Sections 401.513 and 401.515 require the license to be displayed in the facility and each customer to get a written statement of risks, including the eye-protection warning. Linking to a plain-language version of that risk statement from the laser page lets clients read it before they book.

## What about reviews, before and after photos and product names?

Three federal sources apply on top of the Texas rules.

**Reviews.** The FTC’s rule on consumer reviews and testimonials took effect October 21, 2024. It bans fake reviews, buying reviews conditioned on a particular sentiment, undisclosed reviews by officers or managers, and suppressing reviews through threats or by implying the reviews you show are all or most of them ([16 CFR Part 465](${FTC_REVIEWS})). Ask every client for a review the same way, and never offer a discount only for a five-star one. Our guide on [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) covers the Google side.

**Before and after photos.** Under the Endorsement Guides, an endorsement about a key result is likely to be read as typical. If you can’t show it is typical, the ad should clearly disclose what results clients can generally expect ([16 CFR Part 255](${FTC_ENDORSE})). Put a short, readable note beside the gallery itself: the treatment, the number of sessions, the time between photos, and that results vary. Combine that with the Texas consent rule, and use only your own patients’ photos.

**Product names and approved uses.** The FDA says dermal fillers are approved for adults over 21 for specific uses, recommends against them for body contouring such as breast or buttock augmentation, and notes that injectable silicone is not approved for any aesthetic procedure ([FDA on dermal fillers](${FDA_FILLERS})). Botulinum toxin products are prescription drugs; in 2024 the FDA warned about counterfeit Botox given to consumers in several states and reminded providers to buy only from authorized sources ([FDA alert](${FDA_BOTOX})). A treatment page that names the product, its approved area and who injects it answers the questions careful clients now ask.

## How do Dallas clients choose a med spa online?

By treatment, by provider and by trust. Most people searching “lip filler Dallas” or “laser hair removal near Uptown” want one answer: what the treatment involves, who does it, what it costs, how long recovery takes and how to book. A single menu page can’t answer all of that for every treatment, so give each treatment its own page.

A strong treatment page for a Dallas practice includes:

- What the treatment is and what it isn’t, in plain words.
- Who performs it, by name and credential, and who supervises.
- What happens at the consultation, the visit and the days after.
- Price or a price range if you publish one, and what it includes.
- Real before and after photos with consent and the context described above.
- One clear way to request a consultation.

Language matters too. Census Bureau figures show 41.2% of Dallas residents age 5 and older speak a language other than English at home (2020 to 2024) ([Census QuickFacts, Dallas](${CENSUS_DAL})). If your team consults in Spanish, a Spanish version of your key treatment pages, reviewed by a fluent speaker and linked to the English pages, serves those clients properly ([localized versions](${HREFLANG})).

Speed counts on phones, where most of these searches happen. Large galleries and background videos are the usual reason aesthetics sites feel slow; our plain-English guide to [Core Web Vitals](/blog/is-your-website-fast-enough) explains what to measure.

Want to see how your current site would look with all of this in place? Send it for a [free redesign](/redesign). You’ll see your own pages rebuilt, free and without commitment, before deciding anything.

![Hands holding a smartphone showing an appointment booking screen in a salon](https://images.unsplash.com/photo-1778711310283-cac086522cac?auto=format&fit=crop&w=1200&q=75)

## Can a med spa website use tracking pixels and contact forms?

Carefully. The Department of Health and Human Services’ guidance on online tracking says HIPAA-regulated entities may not use tracking technologies in a way that results in impermissible disclosures of protected health information, and gives the example of a patient booking an appointment on a clinic website with third-party tracking. A federal court in Texas vacated part of that guidance in June 2024, the part about unauthenticated public pages, and HHS says it is evaluating next steps ([HHS online tracking guidance](${HHS_TRACKING})). The guidance also points out that businesses outside HIPAA may be subject to the FTC’s Health Breach Notification Rule.

Whether your spa is a covered entity is a question for your attorney. Either way, a simple approach keeps risk low: keep the consultation form to contact details and the treatment a client is interested in, ask clients not to send medical history through it, and don’t put advertising pixels on booking or form confirmation pages.

## A launch checklist for a Dallas med spa website

1. Medical directorship, supervision or delegation disclosed wherever care is given under standing orders away from the physician’s main practice.
2. Provider pages show the same names and credentials as the name tags and posted notices.
3. Models labeled; testimonials carry a credentials disclaimer and any compensation disclosed.
4. Signed photo consents on file for every before and after image, with context beside each gallery.
5. “Board certified” used only for qualifying boards, with the board named.
6. IV therapy pages name who orders and who administers, consistent with Occupations Code chapter 172.
7. Laser hair removal pages show no risk-free or medical-benefit claims, and the facility license is current if required.
8. Products named only for their approved uses; no unprovable outcome promises.
9. Reviews gathered without incentives tied to sentiment, and none suppressed.
10. Dated copies of every page version kept for two years.
11. No ad pixels on form or booking confirmation pages, and a form that asks for no medical details.
12. One Business Profile per location, named as clients see it on the storefront ([Business Profile guidelines](${GBP_GUIDELINES})).

## How SaySites builds Dallas med spa websites

SaySites med spa sites start with the pages this guide describes: a page for each treatment, provider profiles, a before and after gallery with a “results vary” note, a contact page, and a consultation request form whose med spa intake questions ask nothing clinical. Your spa is described to search engines as a health and beauty business with its address, phone and hours, and every page must pass a 95+ speed check before it goes live. Nothing is invented. Credentials, prices, photos and reviews appear only when you supply them, and you change anything by saying it in plain words, such as “add ‘Model, not a patient’ under the home page photo,” then review it as a draft before publishing. Your medical director can read every page before it goes live, which is what the Texas rules expect.

The Site plan is $15 a month ([websites for med spas](/websites-for/med-spas), [pricing](/pricing)). Have a site already? [Get a free redesign](/redesign) and see your own pages rebuilt first, or [start a 7-day free trial](/signup) and build it yourself this week. Running a dental practice too? Our guide to [Houston dental websites under Texas rules](/blog/houston-dental-practice-website-texas-rules) covers the dental board’s requirements.`,
    faq: [
      { q: 'Does a Texas med spa need to name its medical director on the website?', a: 'Often, yes. Texas Medical Board rule 164.3(b)(8) treats an ad as misleading if it fails to disclose medical directorship, supervision or delegation to non-physicians at a location that is not the physician’s primary practice and where care follows standing orders and protocols. Many med spas work exactly that way, so name the director and explain the supervision clearly.' },
      { q: 'Can a Dallas med spa post before and after photos?', a: 'Yes, with care. Rule 164.2(b) requires patient consent before any photograph is used in advertising, and the physician must keep a copy of each ad for two years. Use only your own patients, label any models as models, and put the treatment, number of sessions, timing and a results-vary note beside each gallery.' },
      { q: 'Can we post patient testimonials on a Texas med spa site?', a: 'Proceed carefully. Board rule 164.3 says a testimonial needs a disclaimer about the credentials of the person giving it and a disclosure of any compensation, while Occupations Code section 101.201 lists advertising that contains a testimonial among misleading practices. Ask a Texas health care attorney how both apply before publishing patient quotes.' },
      { q: 'What does Jenifer’s Law mean for an IV hydration page?', a: 'Jenifer’s Law, effective September 1, 2025, added Occupations Code chapter 172 for elective IV therapy outside physician offices and licensed facilities. A physician may delegate ordering to a supervised PA or APRN, and administering to a supervised PA, APRN or registered nurse. Your page should name who orders, who administers and who supervises.' },
      { q: 'Can a med spa advertise laser hair removal as painless or risk-free?', a: 'No. Texas Health and Safety Code section 401.518 says a laser hair removal facility operator may not claim that laser hair removal is free from risk or provides any medical benefit, and may not run false or misleading ads. Facilities not owned by a physician also need a TDLR license and must give customers a written risk statement.' },
      { q: 'Can a med spa offer discounts for Google reviews?', a: 'Not for reviews of a particular sentiment. The FTC rule on consumer reviews, effective October 21, 2024, bans incentives conditioned on positive or negative reviews, fake reviews, undisclosed staff reviews and review suppression. Ask every client the same way, accept whatever they write, and never hide or threaten over a negative review.' },
      { q: 'What does a SaySites med spa website cost?', a: 'The Site plan is $15 a month with a 7-day free trial, including hosting, a page per treatment, provider profiles, a gallery with a results-vary note and a consultation form that asks nothing clinical. You can also send your current site for a free redesign and see your own pages rebuilt before deciding.' },
    ],
    about: ['Texas Medical Board advertising rules', 'Medical spa websites', 'Elective intravenous therapy', 'Dallas, Texas'],
    published: '2026-10-15',
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
