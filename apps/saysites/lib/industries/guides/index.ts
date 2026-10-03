import type { Guide } from './types'
import { guide as autoRepairShops } from './auto-repair-shops'
import { guide as bakeriesAndCafes } from './bakeries-and-cafes'
import { guide as cleaningCompanies } from './cleaning-companies'
import { guide as dentists } from './dentists'
import { guide as electricians } from './electricians'
import { guide as hairSalons } from './hair-salons'
import { guide as hvacCompanies } from './hvac-companies'
import { guide as landscapers } from './landscapers'
import { guide as lawFirms } from './law-firms'
import { guide as medSpas } from './med-spas'
import { guide as medicalPractices } from './medical-practices'
import { guide as plumbers } from './plumbers'
import { guide as restaurants } from './restaurants'
import { guide as roofers } from './roofers'
import { guide as shops } from './shops'

export type { Guide } from './types'

// The long-form guide for each industry page, by slug.
export const GUIDES: Record<string, Guide> = {
  'auto-repair-shops': autoRepairShops,
  'bakeries-and-cafes': bakeriesAndCafes,
  'cleaning-companies': cleaningCompanies,
  'dentists': dentists,
  'electricians': electricians,
  'hair-salons': hairSalons,
  'hvac-companies': hvacCompanies,
  'landscapers': landscapers,
  'law-firms': lawFirms,
  'med-spas': medSpas,
  'medical-practices': medicalPractices,
  'plumbers': plumbers,
  'restaurants': restaurants,
  'roofers': roofers,
  'shops': shops,
}
