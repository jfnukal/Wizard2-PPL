import React, { useState, useEffect, useRef } from 'react';
import LogoPPL from './assets/logo-ppl.svg';
import FaviconPPL from './assets/favicon-ppl.svg';

import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ArrowRight,
  Check,
  AlertCircle,
  Copy,
  Globe,
} from 'lucide-react';

const APP_VERSION = 'v1.0.5';
const APP_BUILD_DATE = '2025-05-19';
const APP_VERSION_NOTES = [
  'Initial release',
  'Fixed extraction of array values from SOAP XML',
  'Added proper handling of CustRefs mapping to CustomerReferences',
  'Added consistent Limit=1000 and Offset=0 for all GET requests',
  'Fixed extraction of PackNumbers from SOAP XML with namespace prefixes',
  'Improved handling of comma-separated values in string elements',
];

// --- Typy pro Porovnávací Část ---
type Field = {
  soapField: string;
  restField: string;
  soapType: string;
  restType: string;
  soapRequired: boolean;
  restRequired: boolean;
  soapLength: string;
  restLength: string;
  notes: string;
  notesEn?: string; // Anglická verze poznámek
};

// Sloučený TabName typ zahrnující všechny záložky
type TabName =
  | 'endpoints'
  | 'fields'
  | 'differences'
  | 'examples'
  | 'faq'
  | 'converter'; // | 'codelist'

// Definice typu pro endpointy
type Endpoint = {
  category: string;
  soapOperation: string;
  soapDescription: string;
  restEndpoint: string;
  restDescription: string;
  mainDifferences: string;
  mainDifferencesEn?: string; // Anglická verze rozdílů
  docUrl: string;
};

// --- Typy pro Převodník ---
type RestOutput = {
  success: boolean;
  error?: string;
  operation?: string;
  method?: string;
  path?: string;
  body?: any;
  queryParams?: Record<string, string | string[]>; // Pole pro query parametry
  notes?: Array<{
    type: 'warning' | 'info';
    parameter: string;
    message: string;
  }>;
} | null;

// Detailnější typy pro strukturu dat v převodníku
interface SenderRecipient {
  name: string;
  name2?: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  contact?: string;
  phone?: string;
  email?: string;
}
interface CashOnDelivery {
  codCurrency?: string;
  codPrice?: number;
  codVarSym?: string;
}

interface ExternalNumber {
  code: string;
  externalNumber: string;
}

interface Service {
  code: string;
}

interface SpecificDelivery {
  parcelShopCode?: string;
}

interface Shipment {
  productType: string;
  referenceId?: string;
  note?: string;
  weight?: string | number;
  depot?: string;
  sender: SenderRecipient;
  recipient: SenderRecipient;
  shipmentSet?: { numberOfShipments: number };
  cashOnDelivery?: CashOnDelivery;
  externalNumbers?: ExternalNumber[];
  services?: Service[];
  specificDelivery?: SpecificDelivery;
}

interface Order {
  referenceId: string;
  productType: string;
  orderType: string;
  shipmentCount: number;
  note?: string;
  email?: string;
  date: string;
  sender: SenderRecipient;
  recipient?: SenderRecipient;
}

// Rozšířená podpora pro filtry v SOAP
interface PackageFilter {
  packNumbers?: string[];
  custRefs?: string[];
  dateFrom?: string;
  dateTo?: string;
  packageStates?: string[];
}

interface OrderFilter {
  orderNumbers?: string[];
  custRefs?: string[];
  dateFrom?: string;
  dateTo?: string;
  orderStates?: string[];
}

interface ParcelShopFilter {
  code?: string;
  countryCode?: string;
  zipCode?: string;
  city?: string;
  street?: string;
  accessPointType?: string;
}

// Typ pro jazykovou volbu
type Language = 'cs' | 'en';

// Mapování REST endpointů na URL dokumentace
const endpointDocUrls: Record<string, string> = {
  // 'GET /codelist/ageCheck': 'Číselník pro službu kontroly věku příjemce - CPL API',
  // 'GET /codelist/product': 'Číselník produktů - CPL API',
  // 'GET /codelist/externalNumber': 'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-typ%C5%AF-extern%C3%ADch-%C4%8D%C3%ADsel-13465891e0',
  // 'GET /codelist/country': 'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-zem%C3%AD-povolen%C3%AD-cod-13465892e0',
  // 'GET /codelist/currency': 'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-povolen%C3%BDch-m%C4%9Bn-13465893e0',
  // 'GET /codelist/service': 'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-poskytovan%C3%BDch-slu%C5%BEeb-k-z%C3%A1silk%C3%A1m-13465894e0',
  // 'GET /codelist/servicePriceLimit': 'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-minim%C3%A1ln%C3%ADch-a-maxim%C3%A1ln%C3%ADch-hodnot-u-slu%C5%BEeb-13465895e0',
  // 'GET /codelist/shipmentPhase': 'https://ppl-cpl-api.apidog.io/f%C3%A1ze-z%C3%A1silky-13465896e0',
  // 'GET /codelist/proofOfIdentityType': 'https://ppl-cpl-api.apidog.io/typy-osobn%C3%ADch-doklad%C5%AF-13465899e0',
  // 'GET /codelist/status': '',
  // 'GET /codelist/validationMessage': '',
  'GET /accessPoint':
    'https://ppl-cpl-api.apidog.io/seznam-v%C3%BDdejn%C3%ADch-m%C3%ADst-13465887e0',
  'GET /addressWhisper':
    'https://ppl-cpl-api.apidog.io/na%C5%A1ept%C3%A1va%C4%8D-adres-13465888e0',
  'GET /info': 'https://ppl-cpl-api.apidog.io/info-13465906e0',
  'GET /order':
    'https://ppl-cpl-api.apidog.io/z%C3%ADsk%C3%A1n%C3%AD-informace-o-objedn%C3%A1vce-p%C5%99epravy-13465909e0',
  'POST /order/batch':
    'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-vytvo%C5%99en%C3%AD-objedn%C3%A1vky-odpov%C4%9B%C4%8F-je-v-header-location-13465910e0',
  'GET /order/batch/{batchId}':
    'https://ppl-cpl-api.apidog.io/z%C3%ADskan%C3%AD-stavu-objednávky-13465911e0',
  'POST /order/cancel':
    'https://ppl-cpl-api.apidog.io/zru%C5%A1en%C3%AD-objedn%C3%A1n%C3%AD-svozu-nebo-bal%C3%ADku-z-libovoln%C3%A9-adresy-13465912e0',
  'GET /shipment':
    'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-z%C3%ADsk%C3%A1n%C3%AD-informac%C3%AD-trackingu-k-z%C3%A1silce-13465913e0',
  'POST /shipment/batch':
    'https://ppl-cpl-api.apidog.io/vytvo%C5%99en%C3%AD-z%C3%A1silky-13465914e0',
  'PUT /shipment/batch/{batchId}':
    'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-%C3%BAprav%C4%9B-v%C3%BDstupn%C3%ADho-form%C3%A1tu-%C5%A1t%C3%ADtku-13465915e0',
  'GET /shipment/batch/{batchId}': 'Získání stavu importu zásilky - CPL API',
  'GET /shipment/batch/{batchId}/label': 'Získání etikety - CPL API',
  'POST /shipment/{shipmentNumber}/cancel': 'storno zásilky - CPL API',
  'POST /shipment/{shipmentNumber}/redirect': 'úprava kontaktu - CPL API',
  'GET /versionInformation': 'informace o novinkách - CPL API',
};

type ApiDataType = {
  endpoints: any[];
  fieldMappings: Record<string, any>;
  generalDifferences: any[];
  categories: any[];
  apiExamples: any[];
  faqItems: any[];
  translations: {
    [key: string]: {
      [key: string]: string;
    };
  };
};
// Definice dat pro API porovnání
const apiData = {
  // Překlady pro UI
  translations: {
    cs: {
      // Hlavička
      title: 'Porovnání myAPI (SOAP) vs CPL API (REST) & Převodník',
      // Záložky
      tabEndpoints: 'Endpointy',
      tabFields: 'Pole',
      tabDifferences: 'Rozdíly',
      tabExamples: 'Příklady',
      tabFaq: 'FAQ',
      tabConverter: 'Převodník',
      // Vyhledávání
      searchPlaceholder: 'Vyhledat v záložce',
      // Tabulky a obsah
      soapColumn: 'myAPI (SOAP)',
      restColumn: 'CPL API (REST)',
      categoryColumn: 'Kategorie',
      differencesColumn: 'Klíčové rozdíly',
      detailsButton: 'Detail',
      noResultsFound: 'Nebyly nalezeny žádné odpovídající záznamy pro',
      fieldComparison: 'Porovnání polí',
      selectEndpointFirst:
        'Pro zobrazení porovnání polí vyberte nejprve operaci v záložce',
      mappingNotFound: 'Mapování nebylo nalezeno.',
      // Pole v tabulce
      dataType: 'Datový typ',
      required: 'Povinné',
      maxLength: 'Max. délka',
      description: 'Popis',
      yes: 'Ano',
      no: 'Ne',
      // Vysvětlivky
      legendTitle: 'Vysvětlivky:',
      legendYellowRow: 'Žlutý řádek = pole s rozdíly',
      legendRedText: 'Červený text = konkrétní rozdíl',
      legendArrow: 'Šipka = změna SOAP → REST',
      // Rozdíly
      // Příklady
      examplesTitle: 'Příklady komplexních struktur API',
      examplesDesc:
        'Ukázky složitějších REST API struktur, které je obtížné konvertovat z/do SOAP formátu.',
      complexity: 'Složitost:',
      complexityHigh: 'Vysoká',
      complexityMedium: 'Střední',
      complexityLow: 'Nízká',
      copy: 'Kopírovat',
      copyCode: 'Kopírovat kód',
      // FAQ
      faqTitle: 'Často kladené dotazy (FAQ)',
      faqDesc: 'Odpovědi na běžné otázky týkající se CPL API a migrace.',
      // Převodník
      converterTitle: 'Experimentální SOAP → REST Převodník',
      supportedOperations: 'Podporované operace',
      converterSettings: 'Nastavení převodníku',
      baseUrl: 'Základní URL pro CPL API:',
      converterWarning:
        'Upozornění: Jedná se o zjednodušený převodník pro demonstrační účely. Výsledek nemusí být 100% přesný nebo kompletní, zejména u složitějších struktur.',
      conversionSuccess: 'Konverze úspěšná',
      operationConverted: 'SOAP operace byla převedena na REST',
      method: 'Metoda:',
      endpoint: 'Endpoint:',
      copyEndpoint: 'Kopírovat celý endpoint',
      soapRequest: 'SOAP XML Požadavek',
      reset: 'Resetovat',
      enterSoapXml: 'Vložte SOAP XML požadavek...',
      transform: 'Transformovat na REST',
      restEquivalent: 'REST Ekvivalent',
      resultWillAppear: 'Transformovaný REST JSON výsledek se zobrazí zde.',
      enterSoapAndClick:
        'Vložte SOAP XML a klikněte na tlačítko "Transformovat".',
      conversionError: 'Chyba při konverzi',
      jsonBody: 'Body (JSON):',
      copyJson: 'Kopírovat JSON',
      converterGetRequestNullBodyInfo:
        'Tělo (Body) REST požadavku je pro tuto GET operaci prázdné (`null`). Vstupní data z těla původního SOAP požadavku byla převedena na parametry přímo v URL adrese REST endpointu (tzv. query parametry).',
      // Doporučení pro migraci
      migrationRecommendations: 'Doporučení pro migraci',
      authMigration: '1. Autentizace',
      authMigrationDesc: [
        'Implementujte OAuth2/JWT (client_id, client_secret, Bearer token).',
        'Nahraďte SOAP Auth element voláním endpointu pro získání tokenu.',
      ],
      requestsMigration: '2. Požadavky a odpovědi',
      requestsMigrationDesc: [
        'Přejděte z XML na JSON.',
        'Změňte názvy polí z PascalCase na camelCase.',
        'Ověřte a implementujte nové povinné pole a délková omezení v REST API.',
        'Zpracovávejte HTTP stavové kódy a JSON chybové objekty místo SOAP Faults.',
      ],
      endpointsMigration: '3. Endpointy a operace',
      endpointsMigrationDesc: [
        'Mapujte SOAP operace na odpovídající REST endpointy a HTTP metody (GET, POST, PUT, atd.).',
        'Aktualizujte volání API dle REST architektury (resource-oriented URLs).',
        'Sjednoťte volání číselníků na /codelist/* endpointy.',
      ],
    },
    en: {
      // Header
      title: 'myAPI (SOAP) vs CPL API (REST) Comparison & Converter',
      // Tabs
      tabEndpoints: 'Endpoints',
      tabFields: 'Fields',
      tabDifferences: 'Differences',
      tabExamples: 'Examples',
      tabFaq: 'FAQ',
      tabConverter: 'Converter',
      // Search
      searchPlaceholder: 'Search in the tab',
      // Tables & content
      soapColumn: 'myAPI (SOAP)',
      restColumn: 'CPL API (REST)',
      categoryColumn: 'Category',
      differencesColumn: 'Key Differences',
      detailsButton: 'Details',
      noResultsFound: 'No matching records found for',
      fieldComparison: 'Field Comparison',
      selectEndpointFirst:
        'To view field comparison, first select an operation in the',
      mappingNotFound: 'Mapping not found.',
      // Table fields
      dataType: 'Data Type',
      required: 'Required',
      maxLength: 'Max. Length',
      description: 'Description',
      yes: 'Yes',
      no: 'No',
      // Legend
      legendTitle: 'Legend:',
      legendYellowRow: 'Yellow row = fields with differences',
      legendRedText: 'Red text = specific difference',
      legendArrow: 'Arrow = change SOAP → REST',
      // Differences
      // Examples
      examplesTitle: 'Complex API Structure Examples',
      examplesDesc:
        'Examples of complex REST API structures that are difficult to convert from/to SOAP format.',
      complexity: 'Complexity:',
      complexityHigh: 'High',
      complexityMedium: 'Medium',
      complexityLow: 'Low',
      copy: 'Copy',
      copyCode: 'Copy code',
      // FAQ
      faqTitle: 'Frequently Asked Questions (FAQ)',
      faqDesc: 'Answers to common questions about CPL API and migration.',
      // Converter
      converterTitle: 'Experimental SOAP → REST Converter',
      supportedOperations: 'Supported Operations',
      converterSettings: 'Converter Settings',
      baseUrl: 'Base URL for CPL API:',
      converterWarning:
        'Warning: This is a simplified converter for demonstration purposes. The result may not be 100% accurate or complete, especially for complex structures.',
      conversionSuccess: 'Conversion Successful',
      operationConverted: 'SOAP operation has been converted to REST',
      method: 'Method:',
      endpoint: 'Endpoint:',
      copyEndpoint: 'Copy full endpoint',
      soapRequest: 'SOAP XML Request',
      reset: 'Reset',
      enterSoapXml: 'Enter SOAP XML request...',
      transform: 'Transform to REST',
      restEquivalent: 'REST Equivalent',
      resultWillAppear: 'Transformed REST JSON result will appear here.',
      enterSoapAndClick: 'Enter SOAP XML and click on the "Transform" button.',
      conversionError: 'Conversion Error',
      jsonBody: 'Body (JSON):',
      copyJson: 'Copy JSON',
      converterGetRequestNullBodyInfo:
        "The REST request body is empty (`null`) for this GET operation. Input data from the original SOAP request's body has been converted into parameters directly in the REST endpoint's URL (query parameters).",
      // Migration recommendations
      migrationRecommendations: 'Migration Recommendations',
      authMigration: '1. Authentication',
      authMigrationDesc: [
        'Implement OAuth2/JWT (client_id, client_secret, Bearer token).',
        'Replace SOAP Auth element with token endpoint call.',
      ],
      requestsMigration: '2. Requests and Responses',
      requestsMigrationDesc: [
        'Switch from XML to JSON.',
        'Change field names from PascalCase to camelCase.',
        'Verify and implement new required fields and length constraints in REST API.',
        'Process HTTP status codes and JSON error objects instead of SOAP Faults.',
      ],
      endpointsMigration: '3. Endpoints and Operations',
      endpointsMigrationDesc: [
        'Map SOAP operations to corresponding REST endpoints and HTTP methods (GET, POST, PUT, etc.).',
        'Update API calls according to REST architecture (resource-oriented URLs).',
        'Unify codelist calls to /codelist/* endpoints.',
      ],
    },
  },
  // Kategorie (Identické v obou souborech)
  categories: [
    {
      id: 'shipment',
      name: 'Zásilky',
      nameEn: 'Shipments',
      description: 'Vytvoření a sledování zásilek',
      descriptionEn: 'Creating and tracking shipments',
    },
    {
      id: 'order',
      name: 'Objednávky',
      nameEn: 'Orders',
      description: 'Správa objednávek přepravy',
      descriptionEn: 'Transport order management',
    },
    {
      id: 'accesspoint',
      name: 'Výdejní místa',
      nameEn: 'Access Points',
      description: 'Práce s výdejními místy',
      descriptionEn: 'Working with access points',
    },
    // { id: 'codelist', name: 'Číselníky', nameEn: 'Codelists', description: 'Referenční data a číselníky', descriptionEn: 'Reference data and codelists' }, // codelist
    {
      id: 'auth',
      name: 'Autentizace',
      nameEn: 'Authentication',
      description: 'Přihlášení a autorizace',
      descriptionEn: 'Login and authorization',
    },
  ],
  // Mapování endpointů (Sloučeno z obou souborů, používá endpointDocUrls)
  endpointMappings: [
    // Zásilky
    {
      category: 'shipment',
      soapOperation: 'CreatePackages',
      soapDescription: 'Vloží nové zásilky pro import a vytvoří štítky',
      restEndpoint: 'POST /shipment/batch',
      restDescription: 'Slouží k vytvoření zásilky a získání štítků',
      mainDifferences:
        'REST API poskytuje více validačních pravidel, má jiný formát odpovědi a používá camelCase',
      mainDifferencesEn:
        'REST API provides more validation rules, has a different response format and uses camelCase',
      docUrl: endpointDocUrls['POST /shipment/batch'],
    },
    {
      category: 'shipment',
      soapOperation: 'GetPackages',
      soapDescription: 'Vrátí seznam zásilek dle zadaného filtru',
      restEndpoint: 'GET /shipment',
      restDescription: 'Slouží k získání informací (trackingu) k zásilce',
      mainDifferences:
        'REST API používá query parametry místo komplexního filtru v těle',
      mainDifferencesEn:
        'REST API uses query parameters instead of a complex filter in the body',
      docUrl: endpointDocUrls['GET /shipment'],
    },
    {
      category: 'shipment',
      soapOperation: 'CancelPackage',
      soapDescription: 'Zrušení zásilky',
      restEndpoint: 'POST /shipment/{shipmentNumber}/cancel',
      restDescription: 'Možnost stornovat balík, pokud nebyl fyzicky poslán',
      mainDifferences: 'REST API využívá URL parametr pro identifikaci zásilky',
      mainDifferencesEn: 'REST API uses URL parameter to identify the shipment',
      docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/cancel'],
    },
    {
      category: 'shipment',
      soapOperation: 'UpdatePackage',
      soapDescription: 'Aktualizace údajů zásilky',
      restEndpoint: 'POST /shipment/{shipmentNumber}/redirect',
      restDescription: 'Možnost doplnit informace k balíku',
      mainDifferences: 'REST API poskytuje omezenější možnosti aktualizace',
      mainDifferencesEn: 'REST API provides more limited update options',
      docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/redirect'],
    },
    // Objednávky
    {
      category: 'order',
      soapOperation: 'CreateOrders',
      soapDescription:
        'Vytvoří objednávky přepravy s doručením na adresu příjemce',
      restEndpoint: 'POST /order/batch',
      restDescription: 'Slouží k vytvoření objednávky doručení',
      mainDifferences:
        'V REST API je typ objednávky určen parametrem orderType="transportOrder" a obsahuje údaje o příjemci',
      mainDifferencesEn:
        'In REST API, the order type is defined by the orderType="transportOrder" parameter and contains recipient data',
      docUrl: endpointDocUrls['POST /order/batch'],
    },
    {
      category: 'order',
      soapOperation: 'CreatePickupOrders',
      soapDescription: 'Vytvoří objednávky svozu bez doručení',
      restEndpoint: 'POST /order/batch',
      restDescription: 'Slouží k vytvoření objednávky svozu',
      mainDifferences:
        'V REST API je typ objednávky určen parametrem orderType="collectionOrder" a NEOBSAHUJE údaje o příjemci',
      mainDifferencesEn:
        'In REST API, the order type is defined by the orderType="collectionOrder" parameter and does NOT contain recipient data',
      docUrl: endpointDocUrls['POST /order/batch'],
    },
    {
      category: 'order',
      soapOperation: 'GetOrders',
      soapDescription: 'Vrátí seznam objednávek dle zadaného filtru',
      restEndpoint: 'GET /order',
      restDescription: 'Sledování stavu objednávek',
      mainDifferences:
        'REST API používá query parametry místo komplexního filtru v těle',
      mainDifferencesEn:
        'REST API uses query parameters instead of a complex filter in the body',
      docUrl: endpointDocUrls['GET /order'],
    },
    {
      category: 'order',
      soapOperation: 'CancelOrder',
      soapDescription: 'Zrušení objednávky',
      restEndpoint: 'POST /order/cancel',
      restDescription: 'Zrušení objednání svozu nebo balíku z libovolné adresy',
      mainDifferences:
        'REST API používá query parametry pro identifikaci objednávky',
      mainDifferencesEn: 'REST API uses query parameters to identify the order',
      docUrl: endpointDocUrls['POST /order/cancel'],
    },
    // Výdejní místa
    {
      category: 'accesspoint',
      soapOperation: 'GetParcelShops',
      soapDescription: 'Vrátí seznam ParcelShopů',
      restEndpoint: 'GET /accessPoint',
      restDescription: 'Seznam výdejních míst',
      mainDifferences:
        'REST API má rozšířené možnosti filtrování a detailnější strukturu',
      mainDifferencesEn:
        'REST API has expanded filtering options and a more detailed structure',
      docUrl: endpointDocUrls['GET /accessPoint'],
    },
    // Přidáno z file 2, nebylo v file 1 explicitně
    {
      category: 'address',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /addressWhisper',
      restDescription: 'Našeptávač adres',
      mainDifferences: 'Dostupné pouze v REST API',
      mainDifferencesEn: 'Available only in REST API',
      docUrl: endpointDocUrls['GET /addressWhisper'],
    },
    // Přidáno z file 2, nebylo v file 1 explicitně
    {
      category: 'info',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /info',
      restDescription: 'Info',
      mainDifferences: 'Dostupné pouze v REST API',
      mainDifferencesEn: 'Available only in REST API',
      docUrl: endpointDocUrls['GET /info'],
    },
    {
      category: 'version',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /versionInformation',
      restDescription: 'Informace o novinkách',
      mainDifferences: 'Dostupné pouze v REST API',
      mainDifferencesEn: 'Available only in REST API',
      docUrl: endpointDocUrls['GET /versionInformation'],
    },
    // Codelist - číselníky služeb
    // { category: 'codelist', soapOperation: 'GetCodCurrency', soapDescription: 'Vrátí povolené měny pro dobírku', restEndpoint: 'GET /codelist/currency', restDescription: 'Číselník povolených měn', mainDifferences: 'REST API používá standardizovaný formát pro všechny číselníky', docUrl: endpointDocUrls['GET /codelist/currency'] },
    // { category: 'codelist', soapOperation: 'GetPackProducts', soapDescription: 'Vrátí seznam produktů', restEndpoint: 'GET /codelist/product', restDescription: 'Číselník produktů', mainDifferences: 'REST API používá standardizovaný formát pro všechny číselníky', docUrl: endpointDocUrls['GET /codelist/product'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/ageCheck', restDescription: 'Číselník pro službu kontroly věku příjemce', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/ageCheck'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/externalNumber', restDescription: 'Číselník typů externích čísel', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/externalNumber'] },
    // { category: 'codelist', soapOperation: 'GetProductCountry', soapDescription: 'Vrátí země a produkty pro zákazníka', restEndpoint: 'GET /codelist/country', restDescription: 'Číselník zemí + povolení COD', mainDifferences: 'REST API poskytuje jednodušší strukturu', docUrl: endpointDocUrls['GET /codelist/country'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/service', restDescription: 'Metoda pro získání poskytovaných služeb k zásilkám', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/service'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/servicePriceLimit', restDescription: 'Metoda pro získání minimálních a maximálních hodnot u služeb', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/servicePriceLimit'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/shipmentPhase', restDescription: 'Fáze zásilky', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/shipmentPhase'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/status', restDescription: 'Statusy zásilky /shipment', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/status'] }, // URL chybí i v file 2 [cite: 215]
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/validationMessage', restDescription: 'Chybové hlášení', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/validationMessage'] }, // URL chybí i v file 2 [cite: 215]
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/proofOfIdentityType', restDescription: 'Typy osobních dokladů', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/proofOfIdentityType'] },
    // Autentizace (Identické v obou souborech) [cite: 30, 217]
    {
      category: 'auth',
      soapOperation: 'Login',
      soapDescription: 'Vrátí autentikační ticket',
      restEndpoint: 'OAuth2/JWT autentizace',
      restDescription: 'Standardní autentizace pomocí Bearer tokenu',
      mainDifferences:
        'REST API používá standardní OAuth2/JWT mechanismus místo vlastního',
      mainDifferencesEn:
        'REST API uses standard OAuth2/JWT mechanism instead of proprietary one',
      docUrl: endpointDocUrls['auth-login'] || '',
    },
  ], // <-- Konec endpointMappings

  fieldMappings: {
    // Zásilka - Vytvoření
    'shipment-create': {
      title: 'Vytvoření zásilky',
      titleEn: 'Create Shipment',
      description: 'Porovnání struktur pro vytvoření zásilky',
      descriptionEn: 'Comparison of structures for creating a shipment',
      soapOperation: 'CreatePackages',
      restEndpoint: 'POST /shipment/batch',
      docUrl: endpointDocUrls['POST /shipment/batch'],
      fields: [
        // Všechna pole z file 2 pro shipment-create
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky (systémové)',
          notesEn: 'Shipment number (system)',
        },
        {
          soapField: 'PackRef',
          restField: 'referenceId',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: '50',
          restLength: '50',
          notes: 'Číslo zásilky (zákaznické)',
          notesEn: 'Shipment number (customer reference)',
        },
        {
          soapField: 'PackProductType',
          restField: 'productType',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Typ produktu (např. BUSS)',
          notesEn: 'Product type (e.g. BUSS)',
        },
        {
          soapField: 'Note',
          restField: 'note',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka k zásilce',
          notesEn: 'Shipment note',
        },
        {
          soapField: 'Weight',
          restField: 'weight',
          soapType: 'string',
          restType: 'number',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'N/A',
          notes: 'Hmotnost zásilky',
          notesEn: 'Shipment weight',
        },
        {
          soapField: 'DepoCode',
          restField: 'depot',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Kód depa',
          notesEn: 'Depot code',
        },
        {
          soapField: 'Sender.Name',
          restField: 'sender.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno odesílatele',
          notesEn: 'Sender name',
        },
        {
          soapField: 'Sender.Name2',
          restField: 'sender.name2',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Doplňující jméno odesílatele',
          notesEn: 'Sender additional name',
        },
        {
          soapField: 'Sender.Street',
          restField: 'sender.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice odesílatele',
          notesEn: 'Sender street',
        },
        {
          soapField: 'Sender.City',
          restField: 'sender.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město odesílatele',
          notesEn: 'Sender city',
        },
        {
          soapField: 'Sender.ZipCode',
          restField: 'sender.zipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'PSČ odesílatele',
          notesEn: 'Sender ZIP code',
        },
        {
          soapField: 'Sender.Country',
          restField: 'sender.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Země odesílatele (ISO kód)',
          notesEn: 'Sender country (ISO code)',
        },
        {
          soapField: 'Sender.Contact',
          restField: 'sender.contact',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Kontaktní osoba odesílatele',
          notesEn: 'Sender contact person',
        },
        {
          soapField: 'Sender.Phone',
          restField: 'sender.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Telefon odesílatele',
          notesEn: 'Sender phone',
        },
        {
          soapField: 'Sender.Email',
          restField: 'sender.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Email odesílatele',
          notesEn: 'Sender email',
        },
        {
          soapField: 'Recipient.Name',
          restField: 'recipient.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno příjemce',
          notesEn: 'Recipient name',
        },
        {
          soapField: 'Recipient.Name2',
          restField: 'recipient.name2',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Doplňující jméno příjemce',
          notesEn: 'Recipient additional name',
        },
        {
          soapField: 'Recipient.Street',
          restField: 'recipient.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice příjemce',
          notesEn: 'Recipient street',
        },
        {
          soapField: 'Recipient.City',
          restField: 'recipient.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město příjemce',
          notesEn: 'Recipient city',
        },
        {
          soapField: 'Recipient.ZipCode',
          restField: 'recipient.zipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'PSČ příjemce',
          notesEn: 'Recipient ZIP code',
        },
        {
          soapField: 'Recipient.Country',
          restField: 'recipient.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Země příjemce (ISO kód)',
          notesEn: 'Recipient country (ISO code)',
        },
        {
          soapField: 'Recipient.Contact',
          restField: 'recipient.contact',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Kontaktní osoba příjemce',
          notesEn: 'Recipient contact person',
        },
        {
          soapField: 'Recipient.Phone',
          restField: 'recipient.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Telefon příjemce (v REST povinný)',
          notesEn: 'Recipient phone (required in REST)',
        },
        {
          soapField: 'Recipient.Email',
          restField: 'recipient.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Email příjemce (v REST povinný)',
          notesEn: 'Recipient email (required in REST)',
        },
        {
          soapField: 'PaymentInfo.CodCurrency',
          restField: 'cashOnDelivery.codCurrency',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '3',
          notes: 'Měna dobírky',
          notesEn: 'COD currency',
        },
        {
          soapField: 'PaymentInfo.CodPrice',
          restField: 'cashOnDelivery.codPrice',
          soapType: 'string',
          restType: 'number',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'N/A',
          notes: 'Částka dobírky',
          notesEn: 'COD amount',
        },
        {
          soapField: 'PaymentInfo.CodVarSym',
          restField: 'cashOnDelivery.codVarSym',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'Variabilní symbol dobírky',
          notesEn: 'COD variable symbol',
        },
        {
          soapField: 'SpecDelivery.ParcelShopCode',
          restField: 'specificDelivery.parcelShopCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '20',
          notes: 'Kód výdejního místa (ParcelShopu)',
          notesEn: 'Parcel shop code',
        },
        {
          soapField: 'PackagesExtNums.ExtNumber',
          restField: 'externalNumbers[].externalNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Externí číslo (REST: nutno specifikovat i code např. CUST)',
          notesEn: 'External number (REST: code must be specified, e.g. CUST)',
        },
        {
          soapField: 'AgeVerification',
          restField: 'services[].code',
          soapType: 'boolean',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'Neomezeno',
          notes: 'Kontrola věku (REST: hodnota "AGE_VERIFICATION")',
          notesEn: 'Age verification (REST: value "AGE_VERIFICATION")',
        },
      ],
    },
    // Zásilka - Sledování
    tracking: {
      title: 'Sledování zásilky',
      titleEn: 'Track Shipment',
      description: 'Porovnání struktur pro získání informací o zásilce',
      descriptionEn:
        'Comparison of structures for retrieving shipment information',
      soapOperation: 'GetPackages',
      restEndpoint: 'GET /shipment',
      docUrl: endpointDocUrls['GET /shipment'],
      fields: [
        // Pole z file 2
        {
          soapField: 'Filter.PackNumbers[]',
          restField: 'ShipmentNumbers[] (query param)',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Čísla zásilek (v REST jako query parametr)',
          notesEn: 'Shipment numbers (as query parameter in REST)',
        },
        {
          soapField: 'Filter.CustRefs[]',
          restField: 'CustomerReferences[] (query param)',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Reference zákazníka (v REST jako query parametr)',
          notesEn: 'Customer references (as query parameter in REST)',
        },
        {
          soapField: 'Filter.DateFrom',
          restField: 'DateFrom (query param)',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Počáteční datum rozsahu (v REST jako query parametr)',
          notesEn: 'Start date range (as query parameter in REST)',
        },
        {
          soapField: 'Filter.DateTo',
          restField: 'DateTo (query param)',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Koncové datum rozsahu (v REST jako query parametr)',
          notesEn: 'End date range (as query parameter in REST)',
        },
        {
          soapField: 'Filter.PackageStates',
          restField: 'ShipmentStates (query param)',
          soapType: 'enum',
          restType: 'enum',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Stavy zásilek (v REST jako query parametr)',
          notesEn: 'Shipment states (as query parameter in REST)',
        },
        {
          soapField: 'PackNumber (odpověď)',
          restField: 'shipmentNumber (odpověď)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky v odpovědi',
          notesEn: 'Shipment number in response',
        },
      ],
    },
    'pickup-order-create': {
      title: 'Vytvoření objednávky svozu (bez příjemce)',
      titleEn: 'Create Pickup Order (without recipient)',
      description: 'Porovnání struktur pro vytvoření objednávky svozu',
      descriptionEn: 'Comparison of structures for creating a pickup order',
      soapOperation: 'CreatePickupOrders',
      restEndpoint: 'POST /order/batch',
      docUrl: endpointDocUrls['POST /order/batch'],
      fields: [
        {
          soapField: 'OrdRefId',
          restField: 'referenceId',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Reference objednávky',
          notesEn: 'Order reference',
        },
        {
          soapField: 'PackProductType',
          restField: 'productType',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '4',
          notes: 'Typ produktu',
          notesEn: 'Product type',
        },
        {
          soapField: 'CountPack',
          restField: 'shipmentCount',
          soapType: 'int',
          restType: 'integer',
          soapRequired: true,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Počet balíků',
          notesEn: 'Number of packages',
        },
        {
          soapField: 'SendDate',
          restField: 'date',
          soapType: 'dateTime',
          restType: 'string (date)',
          soapRequired: true,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'YYYY-MM-DD',
          notes: 'Datum odeslání/vyzvednutí',
          notesEn: 'Sending/pickup date',
        },
        {
          soapField: 'Note',
          restField: 'note',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka k objednávce',
          notesEn: 'Order note',
        },
        {
          soapField: 'Email',
          restField: 'email',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Kontaktní email objednávky',
          notesEn: 'Order contact email',
        },
        {
          soapField: 'Sender.Name',
          restField: 'sender.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno odesílatele',
          notesEn: 'Sender name',
        },
        {
          soapField: 'Sender.Street',
          restField: 'sender.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice odesílatele',
          notesEn: 'Sender street',
        },
        {
          soapField: 'Sender.City',
          restField: 'sender.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město odesílatele',
          notesEn: 'Sender city',
        },
        {
          soapField: 'Sender.ZipCode',
          restField: 'sender.zipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'PSČ odesílatele',
          notesEn: 'Sender ZIP code',
        },
        {
          soapField: 'Sender.Country',
          restField: 'sender.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Země odesílatele',
          notesEn: 'Sender country',
        },
        {
          soapField: 'Sender.Phone',
          restField: 'sender.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Telefon odesílatele',
          notesEn: 'Sender phone',
        },
        {
          soapField: 'Sender.Email',
          restField: 'sender.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Email odesílatele',
          notesEn: 'Sender email',
        },
      ],
    },
    // Objednávka - Vytvoření
    'order-create': {
      title: 'Vytvoření objednávky přepravy',
      titleEn: 'Create Transport Order',
      description: 'Porovnání struktur pro vytvoření objednávky doručení',
      descriptionEn: 'Comparison of structures for creating a delivery order',
      soapOperation: 'CreateOrders',
      restEndpoint: 'POST /order/batch',
      docUrl: endpointDocUrls['POST /order/batch'],
      fields: [
        {
          soapField: 'OrdRefId',
          restField: 'referenceId',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Reference objednávky',
          notesEn: 'Order reference',
        },
        {
          soapField: 'PackProductType',
          restField: 'productType',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '4',
          notes: 'Typ produktu',
          notesEn: 'Product type',
        },
        {
          soapField: 'CountPack',
          restField: 'shipmentCount',
          soapType: 'int',
          restType: 'integer',
          soapRequired: true,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Počet balíků',
          notesEn: 'Number of packages',
        },
        {
          soapField: 'SendDate',
          restField: 'date',
          soapType: 'dateTime',
          restType: 'string (date)',
          soapRequired: true,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'YYYY-MM-DD',
          notes: 'Datum odeslání/vyzvednutí',
          notesEn: 'Sending/pickup date',
        },
        {
          soapField: 'Note',
          restField: 'note',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka k objednávce',
          notesEn: 'Order note',
        },
        {
          soapField: 'Email',
          restField: 'email',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Kontaktní email objednávky',
          notesEn: 'Order contact email',
        },
        {
          soapField: 'Sender.Name',
          restField: 'sender.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno odesílatele',
          notesEn: 'Sender name',
        },
        {
          soapField: 'Sender.Street',
          restField: 'sender.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice odesílatele',
          notesEn: 'Sender street',
        },
        {
          soapField: 'Sender.City',
          restField: 'sender.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město odesílatele',
          notesEn: 'Sender city',
        },
        {
          soapField: 'Sender.ZipCode',
          restField: 'sender.zipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'PSČ odesílatele',
          notesEn: 'Sender ZIP code',
        },
        {
          soapField: 'Sender.Country',
          restField: 'sender.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Země odesílatele',
          notesEn: 'Sender country',
        },
        {
          soapField: 'Sender.Phone',
          restField: 'sender.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Telefon odesílatele',
          notesEn: 'Sender phone',
        },
        {
          soapField: 'Sender.Email',
          restField: 'sender.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Email odesílatele',
          notesEn: 'Sender email',
        },

        {
          soapField: 'Recipient.Name',
          restField: 'recipient.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno příjemce',
          notesEn: 'Recipient name',
        },
        {
          soapField: 'Recipient.Street',
          restField: 'recipient.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice příjemce',
          notesEn: 'Recipient street',
        },
        {
          soapField: 'Recipient.City',
          restField: 'recipient.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město příjemce',
          notesEn: 'Recipient city',
        },
        {
          soapField: 'Recipient.ZipCode',
          restField: 'recipient.zipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'PSČ příjemce',
          notesEn: 'Recipient ZIP code',
        },
        {
          soapField: 'Recipient.Country',
          restField: 'recipient.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Země příjemce',
          notesEn: 'Recipient country',
        },
        {
          soapField: 'Recipient.Phone',
          restField: 'recipient.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Telefon příjemce',
          notesEn: 'Recipient phone',
        },
        {
          soapField: 'Recipient.Email',
          restField: 'recipient.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '100',
          notes: 'Email příjemce',
          notesEn: 'Recipient email',
        },
      ],
    },
    // Výdejní místa - Získání
    'accesspoint-get': {
      title: 'Výdejní místa',
      titleEn: 'Access Points',
      description:
        'Porovnání struktur pro získání informací o výdejních místech',
      descriptionEn:
        'Comparison of structures for obtaining information about access points',
      soapOperation: 'GetParcelShops',
      restEndpoint: 'GET /accessPoint',
      docUrl: endpointDocUrls['GET /accessPoint'],
      fields: [
        // Pole z file 2
        {
          soapField: 'Filter.Code',
          restField: 'AccessPointCode (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód výdejního místa',
          notesEn: 'Access point code',
        },
        {
          soapField: 'Filter.CountryCode',
          restField: 'CountryCode (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód země',
          notesEn: 'Country code',
        },
        {
          soapField: 'Filter.ZipCode',
          restField: 'ZipCode (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'PSČ',
          notesEn: 'ZIP code',
        },
        {
          soapField: 'Filter.City',
          restField: 'City (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Město (REST only)',
          notesEn: 'City (REST only)',
        },
        {
          soapField: 'Filter.Street',
          restField: 'Street (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Ulice (REST only)',
          notesEn: 'Street (REST only)',
        },
        {
          soapField: 'Result.AccessPointCode',
          restField: 'accessPointCode (odpověď)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód výdejního místa v odpovědi',
          notesEn: 'Access point code in response',
        },
      ],
    },

    // Číselník - Měny
    // 'codelist-currency': {
    //   title: 'Číselník měn', description: 'Porovnání struktur pro získání seznamu povolených měn', soapOperation: 'GetCodCurrency', restEndpoint: 'GET /codelist/currency', docUrl: endpointDocUrls['GET /codelist/currency'],
    //   fields: [
    //     { soapField: 'CurrencyCode', restField: 'code', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '3', notes: 'Kód měny' },
    //     { soapField: 'CurrencyName', restField: 'name', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Název měny' },
    //    ]
    // },
    // // Číselník - Produkty
    // 'codelist-product': {
    //     title: 'Číselník produktů', description: 'Porovnání struktur pro získání seznamu produktů', soapOperation: 'GetPackProducts', restEndpoint: 'GET /codelist/product', docUrl: endpointDocUrls['GET /codelist/product'],
    //     fields: [ // Pole z file 2
    //         { soapField: 'ProductCode', restField: 'code', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '4', notes: 'Kód produktu' },
    //         { soapField: 'ProductName', restField: 'name', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Název produktu' },
    //         { soapField: 'ProductDesc', restField: 'description', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Popis produktu' },
    //     ]
    // },

    // // Číselník - Země
    // 'codelist-country': {
    //     title: 'Číselník zemí', description: 'Porovnání struktur pro získání seznamu zemí', soapOperation: 'GetProductCountry', restEndpoint: 'GET /codelist/country', docUrl: endpointDocUrls['GET /codelist/country'],
    //     fields: [ // Pole z file 2
    //         { soapField: 'CountryCode', restField: 'code', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '2', notes: 'Kód země' },
    //         { soapField: 'CountryName', restField: 'name', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Název země' },
    //         { soapField: 'IsCODAllowed', restField: 'isCodAllowed', soapType: 'boolean', restType: 'boolean', soapRequired: false, restRequired: true, soapLength: 'N/A', restLength: 'N/A', notes: 'Povolení dobírky' },
    //     ]
    // },

    // Objednávka - Sledování
    'order-get': {
      title: 'Sledování objednávek',
      titleEn: 'Track Orders',
      description: 'Porovnání struktur pro získání informací o objednávkách',
      descriptionEn:
        'Comparison of structures for retrieving order information',
      soapOperation: 'GetOrders',
      restEndpoint: 'GET /order',
      docUrl: endpointDocUrls['GET /order'],
      fields: [
        // Pole z file 2
        {
          soapField: 'Filter.OrderNumbers[]',
          restField: 'OrderNumbers[] (query param)',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Čísla objednávek',
          notesEn: 'Order numbers',
        },
        {
          soapField: 'Filter.CustRefs[]',
          restField: 'CustomerReferences[] (query param)',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Reference zákazníka',
          notesEn: 'Customer references',
        },
        {
          soapField: 'Result.OrderNumber',
          restField: 'orderNumber (odpověď)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo objednávky v odpovědi',
          notesEn: 'Order number in response',
        },
        // ... další pole odpovědi
      ],
    },
    // Zásilka - Zrušení
    'shipment-cancel': {
      title: 'Zrušení zásilky',
      titleEn: 'Cancel Shipment',
      description: 'Porovnání struktur pro zrušení zásilky',
      descriptionEn: 'Comparison of structures for canceling a shipment',
      soapOperation: 'CancelPackage',
      restEndpoint: 'POST /shipment/{shipmentNumber}/cancel',
      docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/cancel'],
      fields: [
        // Pole z file 2
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber (v URL)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky (v REST API je součástí URL)',
          notesEn: 'Shipment number (part of URL in REST API)',
        },
        {
          soapField: 'Note',
          restField: 'note (body)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka ke zrušení zásilky (v REST API v těle požadavku)',
          notesEn: 'Cancellation note (in request body in REST API)',
        },
        {
          soapField: 'ResultStatus',
          restField: 'HTTP status kód',
          soapType: 'string',
          restType: 'integer',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'N/A',
          notes:
            'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)',
          notesEn:
            'Operation result (represented by HTTP status code in REST API)',
        },
        {
          soapField: 'ResultMessage',
          restField: 'message (v těle odpovědi)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Popis výsledku operace (v REST API v těle odpovědi)',
          notesEn:
            'Operation result description (in response body in REST API)',
        },
      ],
    },
    // Zásilka - Přesměrování/Úprava
    'shipment-redirect': {
      title: 'Úprava kontaktu zásilky',
      titleEn: 'Edit Shipment Contact',
      description: 'Porovnání struktur pro aktualizaci/přesměrování zásilky',
      descriptionEn:
        'Comparison of structures for updating/redirecting a shipment',
      soapOperation: 'UpdatePackage',
      restEndpoint: 'POST /shipment/{shipmentNumber}/redirect',
      docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/redirect'],
      fields: [
        // Pole z file 2 + doplnění
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber (v URL)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky (v REST API je součástí URL)',
          notesEn: 'Shipment number (part of URL in REST API)',
        },
        {
          soapField: 'N/A',
          restField: 'recipientContact.phone',
          soapType: 'N/A',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: '50',
          notes: 'Nový telefon příjemce (REST only)',
          notesEn: 'New recipient phone (REST only)',
        },
        {
          soapField: 'N/A',
          restField: 'recipientContact.email',
          soapType: 'N/A',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: '100',
          notes: 'Nový email příjemce (REST only)',
          notesEn: 'New recipient email (REST only)',
        },
        {
          soapField: 'N/A',
          restField: 'note',
          soapType: 'N/A',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: '300',
          notes: 'Poznámka (REST only)',
          notesEn: 'Note (REST only)',
        },
      ],
    },
    // Objednávka - Zrušení
    'order-cancel': {
      title: 'Zrušení objednávky',
      titleEn: 'Cancel Order',
      description: 'Porovnání struktur pro zrušení objednávky',
      descriptionEn: 'Comparison of structures for canceling an order',
      soapOperation: 'CancelOrder',
      restEndpoint: 'POST /order/cancel',
      docUrl: endpointDocUrls['POST /order/cancel'],
      fields: [
        // Pole z file 2
        {
          soapField: 'OrderNumber',
          restField: 'orderNumber (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo objednávky (v REST jako query parametr)',
          notesEn: 'Order number (as query parameter in REST)',
        },
        {
          soapField: 'CustRef',
          restField: 'customerReference (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '40',
          notes: 'Reference zákazníka (v REST jako query parametr)',
          notesEn: 'Customer reference (as query parameter in REST)',
        },
        {
          soapField: 'Note',
          restField: 'note (query param)',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka ke zrušení objednávky (v REST jako query parametr)',
          notesEn: 'Cancellation note (as query parameter in REST)',
        },
        {
          soapField: 'ResultStatus',
          restField: 'HTTP status kód',
          soapType: 'string',
          restType: 'integer',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'N/A',
          notes:
            'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)',
          notesEn:
            'Operation result (represented by HTTP status code in REST API)',
        },
      ],
    },
    // Autentizace - Login
    'auth-login': {
      title: 'Autentizace',
      titleEn: 'Authentication',
      description: 'Porovnání struktur pro autentizaci',
      descriptionEn: 'Comparison of structures for authentication',
      soapOperation: 'Login',
      restEndpoint: 'OAuth2/JWT autentizace',
      docUrl: endpointDocUrls['auth-login'] || '',
      fields: [
        // Pole z file 2
        {
          soapField: 'Username',
          restField: 'client_id',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Uživatelské jméno / ID klienta',
          notesEn: 'Username / Client ID',
        },
        {
          soapField: 'Password',
          restField: 'client_secret',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Heslo / Tajný klíč klienta',
          notesEn: 'Password / Client secret',
        },
        {
          soapField: 'AuthToken (odpověď)',
          restField: 'access_token (odpověď)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Autentizační token v odpovědi',
          notesEn: 'Authentication token in response',
        },
      ],
    },
  }, // <-- Konec fieldMappings

  generalDifferences: [
    {
      category: 'Autentizace',
      categoryEn: 'Authentication',
      soapApproach:
        'Vlastní autentizační model s přihlašovacími údaji v Auth elementu:',
      soapApproachEn:
        'Custom authentication model with login credentials in Auth element:',
      soapExample:
        '<Auth>\n  <UserName>username</UserName>\n  <Password>password</Password>\n  \n  <AuthToken>token</AuthToken>\n</Auth>',
      restApproach: 'Standardní OAuth2 nebo JWT autentizace:',
      restApproachEn: 'Standard OAuth2 or JWT authentication:',
      restExample: 'Authorization: Bearer {token}',
      importance: 'high',
    },
    {
      category: 'Konvence pojmenování',
      categoryEn: 'Naming conventions',
      soapApproach: 'PascalCase konvence',
      soapApproachEn: 'PascalCase convention',
      soapExample: 'PackNumber, RecipientName',
      restApproach: 'camelCase konvence',
      restApproachEn: 'camelCase convention',
      restExample: 'shipmentNumber, recipientName',
      importance: 'medium',
    },
    {
      category: 'Formát požadavků a odpovědí',
      categoryEn: 'Request and response format',
      soapApproach: 'XML struktura s SOAP obálkou',
      soapApproachEn: 'XML structure with SOAP envelope',
      soapExample: '<soapenv:Envelope>...</soapenv:Envelope>',
      restApproach: 'JSON struktura',
      restApproachEn: 'JSON structure',
      restExample: '{ "shipments": [...] }',
      importance: 'high',
    },
    {
      category: 'Komunikační model',
      categoryEn: 'Communication model',
      soapApproach: 'RPC model s operacemi',
      soapApproachEn: 'RPC model with operations',
      soapExample: 'CreatePackages',
      restApproach: 'Resourceový model s HTTP metodami',
      restApproachEn: 'Resource model with HTTP methods',
      restExample: 'POST /shipment/batch',
      importance: 'high',
    },
    {
      category: 'Zpracování chyb',
      categoryEn: 'Error handling',
      soapApproach: 'SOAP Fault struktury',
      soapApproachEn: 'SOAP Fault structures',
      soapExample: '<soapenv:Fault>...</soapenv:Fault>',
      restApproach: 'HTTP stavové kódy s JSON chybovými objekty',
      restApproachEn: 'HTTP status codes with JSON error objects',
      restExample: '{ "status": 400, "detail": "...", "errors": {...} }',
      importance: 'high',
    },
    {
      category: 'Limity délky polí',
      categoryEn: 'Field length limits',
      soapApproach: 'Většinou bez explicitního omezení',
      soapApproachEn: 'Mostly without explicit limitations',
      soapExample: 'Note, Street',
      restApproach: 'Explicitní definice maximálních délek',
      restApproachEn: 'Explicit definition of maximum lengths',
      restExample: 'note: max 300, street: max 60',
      importance: 'high',
    },
    {
      category: 'Stránkování',
      categoryEn: 'Pagination',
      soapApproach: 'Stránkování pomocí komplexních filtrů',
      soapApproachEn: 'Pagination using complex filters',
      soapExample: 'Filter struktura',
      restApproach: 'Standardní stránkování pomocí Limit a Offset',
      restApproachEn: 'Standard pagination using Limit and Offset',
      restExample: '?Limit=100&Offset=0 s hlavičkami X-Paging-*',
      importance: 'medium',
    },
    {
      category: 'Dokumentace',
      categoryEn: 'Documentation',
      soapApproach: 'WSDL soubor s XML schématem',
      soapApproachEn: 'WSDL file with XML schema',
      soapExample: '<wsdl:definitions>...</wsdl:definitions>',
      restApproach: 'OpenAPI (Swagger) specifikace',
      restApproachEn: 'OpenAPI (Swagger) specification',
      restExample: '{ "openapi": "3.0.1", ... }',
      importance: 'medium',
    },

    // záložka - kategorie číselníky
    // { category: 'Číselníky', soapApproach: 'Omezený počet samostatných operací', soapExample: 'GetCodCurrency', restApproach: 'Jednotný přístup přes /codelist/*', restExample: 'GET /codelist/currency', importance: 'high' },
    // Ujistěte se, že za posledním rozdílem NENÍ čárka
  ], // <-- Konec generalDifferences
  apiExamples: [
    {
      id: 'multi-package-shipment',
      title: 'Více zásilek s individuálními váhami a čísly',
      titleEn: 'Multiple shipments with individual weights and numbers',
      description:
        'Komplexní příklad se sadou zásilek, kde každá zásilka má vlastní váhu a vlastní jedinečná externí čísla',
      descriptionEn:
        'Complex example with a set of shipments, where each shipment has its own weight and unique external numbers',
      endpoint: '/shipment/batch',
      method: 'POST',
      requestBody: `{
  "returnChannel": {
    "type": "Email",
    "address": "jfnukal@elinkx.cz"
  },
  "labelSettings": {
    "format": "ZPL",
    "dpi": 300,
    "completeLabelSettings": {
      "isCompleteLabelRequested": true,
      "pageSize": "A4",
      "position": 1
    }
  },
  "shipments": [
    {
      "referenceId": "Reference03",
      "productType": "CONN",
      "note": "Poznamka",
      "integratorId": "422609",
      
      "shipmentSet": {
        "numberOfShipments": 3,
        "shipmentSetItems": [
          {
            "weighedShipmentInfo": {
              "weight": 1.5
            },
            "externalNumbers": [
              { 
                "externalNumber": "Ext_Box1_CUST", 
                "code": "CUST"
              }
            ]
          },
          {
            "weighedShipmentInfo": {
              "weight": 3.2
            },
            "externalNumbers": [
              { 
                "externalNumber": "Ext_Box2_CUST", 
                "code": "CUST"
              },
              { 
                "externalNumber": "B2CO_000222", 
                "code": "B2CO"
              }
            ]
          },
          {
            "weighedShipmentInfo": {
              "weight": 5.8
            },
            "externalNumbers": [
              { 
                "externalNumber": "Ext_Box3_CUST", 
                "code": "CUST"
              },
              { 
                "externalNumber": "B2CO_000333", 
                "code": "B2CO"
              },
              { 
                "externalNumber": "ESHOP_999", 
                "code": "VARS"
              }
            ]
          }
        ]
      },
      
      "sender": {
        "name": "Name sender",
        "street": "Street sender 99",
        "city": "Olomouc",
        "zipCode": "77200",
        "country": "CZ",
        "contact": "Contact sender",
        "phone": "+420777999888",
        "email": "test@test.cz"
      },
      
      "recipient": {
        "name": "Recipient Gunter",
        "street": "Janosika 22",
        "city": "Zilina",
        "zipCode": "01001",
        "country": "SK",
        "contact": "Recipient Kontakte",
        "phone": "+49777888999",
        "email": "recipient@example.sk"
      },
      
      "insurance": {
        "insurancePrice": "156000",
        "insuranceCurrency": "CZK"
      },
      
      "dormant": {
        "note": "Poznamka return",
        "depot": "07",
        "recipient": {
          "name": "Name return",
          "street": "Street return 99",
          "city": "Olomouc",
          "zipCode": "77200",
          "country": "CZ",
          "contact": "Contact return",
          "phone": "+420777999888",
          "email": "test@test.cz"
        },
        "services": [
          {
            "code": "PUBC"
          }
        ]
      }
    }
  ]
}`,
      complexity: 'complex',
      category: 'Zásilky',
      categoryEn: 'Shipments',
    },

    {
      id: 'individual-insurance',
      title: 'Zásilky s individuálním pojištěním',
      titleEn: 'Shipments with individual insurance',
      description:
        'Příklad sady zásilek, kde každá zásilka má vlastní váhu a vlastní pojistnou částku',
      descriptionEn:
        'Example of a set of shipments where each shipment has its own weight and insurance amount',
      endpoint: '/shipment/batch',
      method: 'POST',
      requestBody: `{
  "returnChannel": {
    "type": "Email",
    "address": "mkaisersat@ppl.cz"
  },
  "labelSettings": {
    "format": "Pdf",
    "dpi": 600,
    "completeLabelSettings": {
      "isCompleteLabelRequested": true,
      "pageSize": "A4",
      "position": 2
    }
  },
  "shipments": [
    {
      "referenceId": "123456a4",
      "productType": "CONN",
      "note": "poznamka",
      "depot": "07",
      "shipmentSet": {
        "numberOfShipments": 2,
        "shipmentSetItems": [
          {
            "weighedShipmentInfo": {
              "weight": 1
            },
            "insurance": {
              "insurancePrice": 100000.01,
              "insuranceCurrency": "CZK"
            }
          },
          {
            "weighedShipmentInfo": {
              "weight": 2
            },
            "insurance": {
              "insurancePrice": 200000,
              "insuranceCurrency": "CZK"
            }
          }
        ]
      },
      "sender": {
        "name": "Pavel Peknica",
        "street": "Vysni Lhoty 222",
        "city": "Dobrá",
        "zipCode": "73951",
        "country": "CZ",
        "phone": "123654789",
        "email": "pavel@peca.cz"
      },
      "recipient": {
        "name": "Lukáš Richter",
        "street": "Nové Dvory-Podhůří 3844",
        "city": "Berlin",
        "zipCode": "10112",
        "country": "DE",
        "phone": "369852147",
        "email": "pavel@peca.cz"
      }
    }
  ]
}`,
      complexity: 'complex',
      category: 'Zásilky',
      categoryEn: 'Shipments',
    },
  ], // <-- Konec apiExamples
  faqItems: [
    {
      id: 'auth-how',
      question: 'Jak se přihlásit k API?',
      questionEn: 'How to authenticate to the API?',
      answer:
        'Pro přihlášení k CPL API je potřeba použít OAuth2 autentizaci. Volání probíhá pomocí client_id a client_secret, které získáte od PPL. Autentizace se provádí na endpointu /login/getAccessToken a vrátí vám JWT token, který následně používáte v hlavičce Authorization: Bearer {token} pro všechna další API volání.',
      answerEn:
        'To log in to CPL API, you need to use OAuth2 authentication. The call is performed using client_id and client_secret, which you can obtain from PPL. Authentication is performed at the /login/getAccessToken endpoint and returns a JWT token, which you then use in the Authorization: Bearer {token} header for all subsequent API calls.',
      category: 'Autentizace',
      categoryEn: 'Authentication',
    },
    {
      id: 'shipment-create',
      question: 'Jak vytvořit zásilku?',
      questionEn: 'How to create a shipment?',
      answer:
        'Pro vytvoření zásilky použijte metodu POST na endpoint /shipment/batch. V požadavku musíte specifikovat informace o odesílateli, příjemci, typu produktu, počtu balíků a dalších parametrech zásilky. Po úspěšném vytvoření získáte identifikátor dávky, pomocí kterého můžete stáhnout štítky nebo zjistit stav importu zásilky.',
      answerEn:
        'To create a shipment, use the POST method on the /shipment/batch endpoint. In the request, you must specify information about the sender, recipient, product type, number of packages, and other shipment parameters. After successful creation, you will receive a batch identifier that you can use to download labels or check the status of the shipment import.',
      category: 'Zásilky',
      categoryEn: 'Shipments',
    },
    // Můžete přidat další FAQ...
  ], // <-- Konec faqItems
}; // <-- Konec apiData

const ApiComparisonConverter: React.FC = () => {
  // State pro porovnávací část (sloučeno z obou)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFieldMapping, setSelectedFieldMapping] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabName>('endpoints');
  const [expandedDifferences, setExpandedDifferences] = useState<number[]>([]);
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: '0px',
    width: '0px',
  });
  const [language, setLanguage] = useState<Language>('cs'); // Výchozí jazyk je čeština

  // State pro převodníkovou část
  const [soapInput, setSoapInput] = useState('');
  const [restOutput, setRestOutput] = useState<RestOutput>(null);
  const [converterBaseUrl, setConverterBaseUrl] = useState(
    'https://api.dhl.com/ecs/ppl/myapi2'
  );

  // Reference pro záložky
  const tabRefs = {
    endpoints: useRef<HTMLButtonElement>(null),
    fields: useRef<HTMLButtonElement>(null),
    //codelist: useRef<HTMLButtonElement>(null), // Odstraň referenci pro záložku 'codelist' (řádek 139):
    differences: useRef<HTMLButtonElement>(null),
    examples: useRef<HTMLButtonElement>(null),
    faq: useRef<HTMLButtonElement>(null),
    converter: useRef<HTMLButtonElement>(null),
  };

  const renderVersionInfo = () => (
    <div className="text-xs text-gray-500 text-right mt-4">
      {APP_VERSION} ({APP_BUILD_DATE})
    </div>
  );

  // Helper funkce pro překlad
  const t = (key: string): string => {
    // Bezpečný přístup s explicitními typy
    const translationObj =
      apiData.translations[language as keyof typeof apiData.translations];
    if (translationObj && typeof translationObj === 'object') {
      // Použijeme 'as any' pro obejití typové kontroly při přístupu ke klíči
      // Toto není ideální řešení z hlediska typové bezpečnosti, ale pro tento případ to stačí
      const value = (translationObj as any)[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    return key;
  };
  // Filtrované endpointy pro zobrazení
  const filteredEndpoints = apiData.endpointMappings.filter(
    (ep: Endpoint) =>
      !searchTerm ||
      ep.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Číselníkové endpointy
  //  const codelistEndpoints = apiData.endpointMappings.filter(
  //   (ep: Endpoint) => ep.category === 'codelist' &&
  //   (!searchTerm ||
  //    ep.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //    ep.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase()))
  // );

  // UseEffect pro nastavení faviconu a indikátoru záložek
  useEffect(() => {
    const existingFavicon = document.querySelector("link[rel='icon']");
    const faviconElement = (existingFavicon ||
      document.createElement('link')) as HTMLLinkElement;
    faviconElement.type = 'image/svg+xml';
    faviconElement.rel = 'icon';
    faviconElement.href = FaviconPPL;
    if (!existingFavicon) document.head.appendChild(faviconElement);

    return () => {
      if (!existingFavicon && faviconElement.parentNode) {
        document.head.removeChild(faviconElement);
      }
    };
  }, []);

  useEffect(() => {
    const activeTabRef = tabRefs[activeTab];
    if (activeTabRef?.current) {
      const tabElement = activeTabRef.current;
      setIndicatorStyle({
        left: `${tabElement.offsetLeft}px`,
        width: `${tabElement.offsetWidth}px`,
      });
    }
  }, [activeTab]);

  // Přepínání rozbalení/sbalení rozdílů
  const toggleDifference = (index: number) => {
    setExpandedDifferences((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Zvýraznění rozdílů v polích
  const highlightDifferences = (field: Field) => {
    const hasTypeDiff = field.soapType !== field.restType;
    const hasRequiredDiff = field.soapRequired !== field.restRequired;
    const hasLengthDiff = field.soapLength !== field.restLength;
    const hasAnyDiff = hasTypeDiff || hasRequiredDiff || hasLengthDiff;

    return { hasTypeDiff, hasRequiredDiff, hasLengthDiff, hasAnyDiff };
  };

  // Filtrování polí podle vyhledávání
  const getFilteredFields = (mappingId: string | null) => {
    if (!mappingId) return [];

    const mapping =
      apiData.fieldMappings[mappingId as keyof typeof apiData.fieldMappings];
    if (!mapping || !mapping.fields) return [];

    return mapping.fields.filter(
      (field: Field) =>
        !searchTerm ||
        field.soapField.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.restField.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Kopírování do schránky
  const copyToClipboard = (text: string, buttonId: string): void => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedButtonId(buttonId);
        setTimeout(() => setCopiedButtonId(null), 2000); // Reset po 2 sekundách
      },
      (err) => {
        console.error('Nepodařilo se zkopírovat text: ', err);
      }
    );
  };

  // Přepnutí jazyka
  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === 'cs' ? 'en' : 'cs'));
  };

  // Pomocné funkce pro extrakci hodnot z XML - AKTUALIZOVANÉ FUNKCE
  const extractValue = (xml: string, path: string): string | null => {
    const tagName = path.split('.').pop();
    if (!tagName) return null;

    // 1. Zkusíme nejprve s obecným vzorem pro namespace (stávající kód)
    const generalPattern = new RegExp(
      `<(?:\\w+:)?${tagName}[^>]*>([^<]*)</(?:\\w+:)?${tagName}>`,
      'i'
    );
    const generalMatch = xml.match(generalPattern);
    if (generalMatch) {
      return generalMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim();
    }

    // 2. Pokud selže obecný vzor, zkusíme konkrétní případ pro v1: namespace
    const v1Pattern = new RegExp(
      `<v1:${tagName}[^>]*>([^<]*)</v1:${tagName}>`,
      'i'
    );
    const v1Match = xml.match(v1Pattern);
    if (v1Match) {
      return v1Match[1].replace('<![CDATA[', '').replace(']]>', '').trim();
    }

    // 3. A pokud vše selže, zkusíme přímé hledání tagu bez ohledu na cestu
    const directPattern = new RegExp(
      `<(?:\\w+:)?${tagName}[^>]*>([^<]*)</(?:\\w+:)?${tagName}>`,
      'i'
    );
    const directMatch = xml.match(directPattern);
    if (directMatch) {
      return directMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim();
    }

    return null;
  };

  // Extrakce vnořené hodnoty
  const extractNestedValue = (
    xml: string,
    parentPath: string,
    childPath: string
  ): string | null => {
    const parentTag = parentPath.split('.').pop();
    const childTag = childPath.split('.').pop();
    if (!parentTag || !childTag) return null;

    const parentPattern = new RegExp(
      `<(?:\\w+:)?${parentTag}[^>]*>(.*?)</(?:\\w+:)?${parentTag}>`,
      'is'
    );
    const parentMatch = xml.match(parentPattern);

    if (parentMatch?.[1]) {
      const parentContent = parentMatch[1];
      const childPattern = new RegExp(
        `<(?:\\w+:)?${childTag}[^>]*>([^<]*)</(?:\\w+:)?${childTag}>`,
        'i'
      );
      const childMatch = parentContent.match(childPattern);
      return childMatch
        ? childMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim()
        : null;
    }
    return null;
  };

  // NOVÁ FUNKCE: Extrakce pole hodnot (např. pro PackNumbers[])
  const extractArrayValues = (xml: string, path: string): string[] => {
    const startTime = new Date().getTime();
    console.log(`[START] Extracting array values for path: ${path}`);

    const parts = path.split('.');
    if (parts.length < 2) {
      console.log(`[ERROR] Invalid path format: ${path}`);
      return [];
    }

    const parentTag = parts[0];
    const childTag = parts[1];

    console.log(`Looking for parent: ${parentTag}, child: ${childTag}`);

    try {
      // První zpřísněný způsob: hledáme konkrétní v1: prefix pro Filter a arr: pro string
      let values: string[] = [];

      // Vzor: <v1:Filter>...<v1:ChildTag>...<arr:string>value</arr:string>...</v1:ChildTag>...</v1:Filter>
      const regexPattern = new RegExp(
        `<(?:v1:)?${parentTag}[^>]*>.*?<(?:v1:)?${childTag}[^>]*>(.*?)</(?:v1:)?${childTag}>.*?</(?:v1:)?${parentTag}>`,
        'is'
      );
      const match = xml.match(regexPattern);

      if (match && match[1]) {
        const childContent = match[1];
        console.log(
          `Found content for ${childTag} (${childContent.length} chars)`
        );

        // Extrakce string hodnot
        const stringRegex = /<(?:arr:)?string[^>]*>(.*?)<\/(?:arr:)?string>/gi;
        let stringMatch;

        while ((stringMatch = stringRegex.exec(childContent)) !== null) {
          const value = stringMatch[1].trim();
          console.log(`Found string value: "${value}"`);

          if (value) {
            if (value.includes(',')) {
              const splitValues = value
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean);
              console.log(
                `Split comma-separated value into ${splitValues.length} parts`
              );
              values.push(...splitValues);
            } else {
              values.push(value);
            }
          }
        }
      } else {
        console.log(`No match found for ${parentTag}.${childTag}`);
      }

      console.log(
        `[END] Extracted ${values.length} values for ${path} in ${
          new Date().getTime() - startTime
        }ms`
      );
      return values;
    } catch (error) {
      console.error(`[ERROR] Error extracting values for ${path}:`, error);
      return [];
    }
  };

  // NOVÁ FUNKCE: Vytvoření query stringu z parametrů
  const constructQueryString = (
    params: Record<string, string | string[] | undefined>
  ): string => {
    console.log(
      'Constructing query string from params:',
      JSON.stringify(params, null, 2)
    );

    if (!params || Object.keys(params).length === 0) {
      console.log('No params to construct query string');
      return '';
    }

    const queryParts: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
      console.log(`Processing param ${key}:`, value);

      if (value === undefined) {
        console.log(`- Skipping undefined value for ${key}`);
        return;
      }

      if (Array.isArray(value)) {
        console.log(`- Array value for ${key}, length: ${value.length}`);

        if (value.length === 0) {
          console.log(`- Skipping empty array for ${key}`);
          return;
        }

        // Pro pole hodnot přidáme každou hodnotu zvlášť s opakovaným klíčem
        value.forEach((item, index) => {
          if (item) {
            const paramPart = `${encodeURIComponent(key)}=${encodeURIComponent(
              item
            )}`;
            console.log(`  - Adding array item ${index}: ${paramPart}`);
            queryParts.push(paramPart);
          } else {
            console.log(`  - Skipping empty item ${index}`);
          }
        });
      } else {
        const paramPart = `${encodeURIComponent(key)}=${encodeURIComponent(
          value
        )}`;
        console.log(`- Adding single value: ${paramPart}`);
        queryParts.push(paramPart);
      }
    });

    const result = queryParts.length ? '?' + queryParts.join('&') : '';
    console.log('Final constructed query string:', result);
    return result;
  };

  // NOVÁ FUNKCE: Formátování data do YYYY-MM-DD
  const formatDateToYYYYMMDD = (dateStr: string): string => {
    try {
      // Pokud už má správný formát, vrátíme jej
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

      // Zkusíme převést na datum
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Neplatné datum:', dateStr);
        return new Date().toISOString().split('T')[0]; // Dnešní datum jako záloha
      }

      // Formátování na YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Chyba při formátování data:', error);
      return new Date().toISOString().split('T')[0]; // Dnešní datum jako záloha
    }
  };

  // Zpracování CreatePackages - OPRAVENÁ VERZE
  const handleCreatePackages = (xml: string) => {
    // --- Extrakce pro top-level pole (pokud existuje) ---
    const integratorId = extractValue(xml, 'IntegrId') ?? undefined;

    // --- Extrakce pro Shipment objekt ---
    const shipment: Shipment = {
      productType: extractValue(xml, 'PackProductType') || 'BUSS',
      referenceId: extractValue(xml, 'PackRef') ?? undefined,
      note: extractValue(xml, 'Note') ?? undefined,
      depot: extractValue(xml, 'DepoCode') ?? undefined,
      sender: {
        name: extractNestedValue(xml, 'Sender', 'Name') || 'chybějící - jméno',
        street:
          extractNestedValue(xml, 'Sender', 'Street') || 'chybějící - ulice',
        city: extractNestedValue(xml, 'Sender', 'City') || 'chybějící - město',
        zipCode:
          extractNestedValue(xml, 'Sender', 'ZipCode') || 'chybějící - PSČ',
        country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
        name2: extractNestedValue(xml, 'Sender', 'Name2') ?? undefined,
        contact: extractNestedValue(xml, 'Sender', 'Contact') ?? undefined,
        phone: extractNestedValue(xml, 'Sender', 'Phone') ?? undefined,
        email: extractNestedValue(xml, 'Sender', 'Email') ?? undefined,
      },
      recipient: {
        name:
          extractNestedValue(xml, 'Recipient', 'Name') || 'chybějící - jméno',
        street:
          extractNestedValue(xml, 'Recipient', 'Street') || 'chybějící - ulice',
        city:
          extractNestedValue(xml, 'Recipient', 'City') || 'chybějící - město',
        zipCode:
          extractNestedValue(xml, 'Recipient', 'ZipCode') || 'chybějící - PSČ',
        country: extractNestedValue(xml, 'Recipient', 'Country') || 'CZ',
        phone:
          extractNestedValue(xml, 'Recipient', 'Phone') ||
          'chybějící - telefon',
        email:
          extractNestedValue(xml, 'Recipient', 'Email') || 'chybějící - email',
        name2: extractNestedValue(xml, 'Recipient', 'Name2') ?? undefined,
        contact: extractNestedValue(xml, 'Recipient', 'Contact') ?? undefined,
      },
    };

    // Přidáme shipmentSet, pokud se nalezne v XML
    const packagesInSet = extractNestedValue(
      xml,
      'PackageSet',
      'PackagesInSet'
    );
    if (packagesInSet) {
      shipment.shipmentSet = {
        numberOfShipments: parseInt(packagesInSet, 10) || 1,
      };
    }

    // --- AKTUALIZACE: Validace povinných polí pro REST ---
    // Ověříme, že telefon a email příjemce jsou vyplněny (v REST API jsou povinné)
    if (
      !shipment.recipient.phone ||
      shipment.recipient.phone === 'chybějící - telefon'
    ) {
      console.warn('Chybí povinné pole recipient.phone, bude nutné doplnit');
      // Můžeme nastavit defaultní hodnotu nebo nechat uživatele vědět
      shipment.recipient.phone = 'VYŽADOVÁNO V REST API';
    }

    if (
      !shipment.recipient.email ||
      shipment.recipient.email === 'chybějící - email'
    ) {
      console.warn('Chybí povinné pole recipient.email, bude nutné doplnit');
      shipment.recipient.email = 'VYŽADOVÁNO V REST API';
    }

    // --- Volitelná pole přidáváme pouze pokud existují v SOAP ---
    const weightStr = extractValue(xml, 'Weight');
    if (weightStr) {
      // AKTUALIZACE: Převod na číslo pro REST API
      const weightNum = parseFloat(weightStr);
      shipment.weight = !isNaN(weightNum) ? weightNum : weightStr;
    }

    const parcelShopCode = extractNestedValue(
      xml,
      'SpecDelivery',
      'ParcelShopCode'
    );
    if (parcelShopCode) {
      shipment.specificDelivery = { parcelShopCode };
    }

    const codCurrency = extractNestedValue(xml, 'PaymentInfo', 'CodCurrency');
    const codPriceStr = extractNestedValue(xml, 'PaymentInfo', 'CodPrice');
    const codVarSym = extractNestedValue(xml, 'PaymentInfo', 'CodVarSym');
    if (codCurrency || codPriceStr || codVarSym) {
      shipment.cashOnDelivery = {};
      if (codCurrency) shipment.cashOnDelivery.codCurrency = codCurrency;
      if (codPriceStr) {
        const priceNum = parseFloat(codPriceStr);
        if (!isNaN(priceNum)) {
          shipment.cashOnDelivery.codPrice = priceNum; // Převod na číslo
        }
      }
      if (codVarSym) shipment.cashOnDelivery.codVarSym = codVarSym;
    }

    const extNumber = extractNestedValue(xml, 'PackagesExtNums', 'ExtNumber');
    if (extNumber) {
      shipment.externalNumbers = [{ code: 'CUST', externalNumber: extNumber }];
    }

    const ageCheck = extractValue(xml, 'AgeVerification');
    if (ageCheck && (ageCheck.toLowerCase() === 'true' || ageCheck === '1')) {
      shipment.services = [{ code: 'AGE_VERIFICATION' }];
    }

    // --- Sestavení finálního výstupního objektu ---
    const restBody: any = {
      returnChannel: { type: 'None' },
      labelSettings: { format: 'Pdf', dpi: 300 },
      shipments: [shipment],
    };

    if (integratorId) {
      restBody.integratorId = integratorId;
    }

    setRestOutput({
      success: true,
      operation: 'CreatePackages',
      method: 'POST',
      path: '/shipment/batch',
      body: restBody,
    });
  };

  // Zpracování CreateOrders - POUZE pro doručovací objednávky
  const handleCreateOrders = (xml: string) => {
    try {
      console.log('Zpracovávám CreateOrders - doručovací objednávku');

      // Zjistíme kódy zemí odesílatele a příjemce
      const senderCountry =
        extractNestedValue(xml, 'Sender', 'Country') || 'CZ';
      const recipientCountry =
        extractNestedValue(xml, 'Recipient', 'Country') || 'CZ';

      // Určení správného productType podle pravidel
      let defaultProductType = 'BUSS'; // výchozí hodnota

      // z CZ do CZ = BUSS
      if (senderCountry === 'CZ' && recipientCountry === 'CZ') {
        defaultProductType = 'BUSS';
      }
      // z CZ do SK = CONN
      else if (senderCountry === 'CZ' && recipientCountry === 'SK') {
        defaultProductType = 'CONN';
      }
      // z SK do CZ = IMPO
      else if (senderCountry === 'SK' && recipientCountry === 'CZ') {
        defaultProductType = 'IMPO';
      }

      // Použijeme buď hodnotu z XML nebo vypočtenou výchozí hodnotu
      const productType =
        extractValue(xml, 'PackProductType') || defaultProductType;

      // Vytvoření objektu order s explicitní definicí typu
      const order: {
        referenceId: string;
        productType: string;
        orderType: string;
        shipmentCount: number;
        date: string;
        note?: string;
        email?: string;
        customerReference?: string;
        sender: {
          name: string;
          street: string;
          city: string;
          zipCode: string;
          country: string;
          phone: string;
          email: string;
          name2?: string;
          contact?: string;
        };
        recipient: {
          name: string;
          street: string;
          city: string;
          zipCode: string;
          country: string;
          phone: string;
          email: string;
          name2?: string;
          contact?: string;
        };
      } = {
        referenceId: extractValue(xml, 'OrdRefId') || `chybějící-${Date.now()}`,
        productType: productType,
        orderType: 'transportOrder', // Pevně dáno - objednávka doručení
        shipmentCount: 1, // Výchozí hodnota
        date: new Date().toISOString().split('T')[0], // Výchozí datum
        sender: {
          name:
            extractNestedValue(xml, 'Sender', 'Name') || 'chybějící - jméno',
          street:
            extractNestedValue(xml, 'Sender', 'Street') || 'chybějící - ulice',
          city:
            extractNestedValue(xml, 'Sender', 'City') || 'chybějící - město',
          zipCode:
            extractNestedValue(xml, 'Sender', 'ZipCode') || 'chybějící - PSČ',
          country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
          phone:
            extractNestedValue(xml, 'Sender', 'Phone') || 'chybějící - telefon',
          email:
            extractNestedValue(xml, 'Sender', 'Email') || 'chybějící - email',
        },
        recipient: {
          name:
            extractNestedValue(xml, 'Recipient', 'Name') || 'chybějící - jméno',
          street:
            extractNestedValue(xml, 'Recipient', 'Street') ||
            'chybějící - ulice',
          city:
            extractNestedValue(xml, 'Recipient', 'City') || 'chybějící - město',
          zipCode:
            extractNestedValue(xml, 'Recipient', 'ZipCode') ||
            'chybějící - PSČ',
          country: extractNestedValue(xml, 'Recipient', 'Country') || 'CZ',
          phone:
            extractNestedValue(xml, 'Recipient', 'Phone') ||
            'chybějící - telefon',
          email:
            extractNestedValue(xml, 'Recipient', 'Email') ||
            'chybějící - email',
        },
      };

      // AKTUALIZACE: Lepší zpracování countPack - zajištění, že je to vždy číslo
      const countPackStr = extractValue(xml, 'CountPack');
      if (countPackStr) {
        const packCount = parseInt(countPackStr, 10);
        if (!isNaN(packCount)) {
          order.shipmentCount = packCount;
        }
      }

      // Volitelná pole
      const note = extractValue(xml, 'Note');
      if (note) {
        order.note = note;
      }

      const email = extractValue(xml, 'Email');
      if (email) {
        order.email = email;
      }

      // Doplňující pole odesílatele
      const senderName2 = extractNestedValue(xml, 'Sender', 'Name2');
      if (senderName2) {
        order.sender.name2 = senderName2;
      }

      const senderContact = extractNestedValue(xml, 'Sender', 'Contact');
      if (senderContact) {
        order.sender.contact = senderContact;
      }

      // Doplňující pole příjemce
      const recipientName2 = extractNestedValue(xml, 'Recipient', 'Name2');
      if (recipientName2) {
        order.recipient.name2 = recipientName2;
      }

      const recipientContact = extractNestedValue(xml, 'Recipient', 'Contact');
      if (recipientContact) {
        order.recipient.contact = recipientContact;
      }

      // AKTUALIZACE: Správné formátování data pro REST API (YYYY-MM-DD)
      const sendDateRaw = extractValue(xml, 'SendDate');
      if (sendDateRaw) {
        order.date = formatDateToYYYYMMDD(sendDateRaw);
      }

      // AKTUALIZACE: Validace povinných polí pro odesílatele
      if (!order.sender.phone || order.sender.phone === 'chybějící - telefon') {
        console.warn('Chybí povinné pole sender.phone pro objednávku');
        order.sender.phone = 'VYŽADOVÁNO V REST API';
      }

      if (!order.sender.email || order.sender.email === 'chybějící - email') {
        console.warn('Chybí povinné pole sender.email pro objednávku');
        order.sender.email = 'VYŽADOVÁNO V REST API';
      }

      // AKTUALIZACE: Validace povinných polí pro příjemce
      if (
        !order.recipient.phone ||
        order.recipient.phone === 'chybějící - telefon'
      ) {
        console.warn('Chybí povinné pole recipient.phone pro objednávku');
        order.recipient.phone = 'VYŽADOVÁNO V REST API';
      }

      if (
        !order.recipient.email ||
        order.recipient.email === 'chybějící - email'
      ) {
        console.warn('Chybí povinné pole recipient.email pro objednávku');
        order.recipient.email = 'VYŽADOVÁNO V REST API';
      }

      const custRefValue = extractValue(xml, 'CustRef');
      if (custRefValue) {
        order.customerReference = custRefValue;
      }

      // Přidání výpisu finálního objektu pro kontrolu
      console.log('Finální objekt order:', JSON.stringify(order, null, 2));

      setRestOutput({
        success: true,
        operation: 'CreateOrders',
        method: 'POST',
        path: '/order/batch',
        body: { orders: [order] },
      });
    } catch (error: any) {
      console.error('Chyba uvnitř handleCreateOrders:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování CreateOrders: ${error.message}`,
      });
    }
  };

  // Zpracování CreatePickupOrders - POUZE pro svozové objednávky
  const handleCreatePickupOrders = (xml: string) => {
    try {
      console.log('Zpracovávám CreatePickupOrders - svozovou objednávku');

      // Vytvoření objektu order s explicitní definicí typu
      const order: {
        referenceId: string;
        productType: string;
        orderType: string;
        shipmentCount: number;
        date: string;
        note?: string;
        email?: string;
        customerReference?: string;
        sender: {
          name: string;
          street: string;
          city: string;
          zipCode: string;
          country: string;
          phone: string;
          email: string;
          name2?: string;
          contact?: string;
        };
      } = {
        referenceId: extractValue(xml, 'OrdRefId') || `chybějící-${Date.now()}`,
        productType: extractValue(xml, 'PackProductType') || 'BUSS',
        orderType: 'collectionOrder', // Pevně dáno - objednávka svozu
        shipmentCount: 1, // Výchozí hodnota
        date: new Date().toISOString().split('T')[0], // Výchozí datum
        sender: {
          name:
            extractNestedValue(xml, 'Sender', 'Name') || 'chybějící - jméno',
          street:
            extractNestedValue(xml, 'Sender', 'Street') || 'chybějící - ulice',
          city:
            extractNestedValue(xml, 'Sender', 'City') || 'chybějící - město',
          zipCode:
            extractNestedValue(xml, 'Sender', 'ZipCode') || 'chybějící - PSČ',
          country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
          phone:
            extractNestedValue(xml, 'Sender', 'Phone') || 'chybějící - telefon',
          email:
            extractNestedValue(xml, 'Sender', 'Email') || 'chybějící - email',
        },
      };

      // AKTUALIZACE: Lepší zpracování countPack - zajištění, že je to vždy číslo
      const countPackStr = extractValue(xml, 'CountPack');
      if (countPackStr) {
        const packCount = parseInt(countPackStr, 10);
        if (!isNaN(packCount)) {
          order.shipmentCount = packCount;
        }
      }

      // Volitelná pole
      const note = extractValue(xml, 'Note');
      if (note) {
        order.note = note;
      }

      const email = extractValue(xml, 'Email');
      if (email) {
        order.email = email;
      }

      // Doplňující pole odesílatele
      const senderName2 = extractNestedValue(xml, 'Sender', 'Name2');
      if (senderName2) {
        order.sender.name2 = senderName2;
      }

      const senderContact = extractNestedValue(xml, 'Sender', 'Contact');
      if (senderContact) {
        order.sender.contact = senderContact;
      }

      // AKTUALIZACE: Správné formátování data pro REST API (YYYY-MM-DD)
      const sendDateRaw = extractValue(xml, 'SendDate');
      if (sendDateRaw) {
        order.date = formatDateToYYYYMMDD(sendDateRaw);
      }

      // AKTUALIZACE: Validace povinných polí pro odesílatele
      if (!order.sender.phone || order.sender.phone === 'chybějící - telefon') {
        console.warn('Chybí povinné pole sender.phone pro objednávku');
        order.sender.phone = 'VYŽADOVÁNO V REST API';
      }

      if (!order.sender.email || order.sender.email === 'chybějící - email') {
        console.warn('Chybí povinné pole sender.email pro objednávku');
        order.sender.email = 'VYŽADOVÁNO V REST API';
      }

      const custRefValue = extractValue(xml, 'CustRef');
      if (custRefValue) {
        order.customerReference = custRefValue;
      }

      // Přidání výpisu finálního objektu pro kontrolu
      console.log(
        'Finální objekt pickup order:',
        JSON.stringify(order, null, 2)
      );

      setRestOutput({
        success: true,
        operation: 'CreatePickupOrders',
        method: 'POST',
        path: '/order/batch',
        body: { orders: [order] },
      });
    } catch (error: any) {
      console.error('Chyba uvnitř handleCreatePickupOrders:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování CreatePickupOrders: ${error.message}`,
      });
    }
  };

  // NOVÁ METODA: Zpracování GetPackages (sledování zásilek)
  const handleGetPackages = (xml: string) => {
    console.log('========== ZAČÁTEK handleGetPackages ==========');
    console.log('Vstupní XML:', xml);
    let notes: Array<{
      type: 'warning' | 'info';
      parameter: string;
      message: string;
    }> = [];

    try {
      // Nejprve vyčistíme přístup - vytvoříme prázdné objekty pro filtr a query parametry
      const filter: PackageFilter = {};

      // DŮLEŽITÉ: Nastavíme výchozí hodnoty pro REST API
      const defaultLimit = 1000;
      const defaultOffset = 0;

      // Inicializujeme query parametry pouze s výchozími hodnotami
      const queryParams: Record<string, string | string[]> = {
        Limit: defaultLimit.toString(),
        Offset: defaultOffset.toString(),
      };

      // *** ČISTÉ A ODDĚLENÉ ZPRACOVÁNÍ JEDNOTLIVÝCH PARAMETRŮ ***

      // 1. Zpracování PackNumbers - specificky s detailním logováním
      try {
        console.log('=== Processing PackNumbers ===');
        const packNumbers = extractArrayValues(xml, 'Filter.PackNumbers');
        console.log('Extracted PackNumbers:', packNumbers);

        if (packNumbers && packNumbers.length > 0) {
          queryParams.ShipmentNumbers = packNumbers;
          console.log('Added ShipmentNumbers to queryParams:', packNumbers);
        } else {
          console.log('No ShipmentNumbers to add');
        }
      } catch (e) {
        console.error('Error processing PackNumbers:', e);
      }

      // 2. Zpracování CustRefs - specificky s detailním logováním
      try {
        console.log('=== Processing CustRefs ===');
        const custRefs = extractArrayValues(xml, 'Filter.CustRefs');
        console.log('Extracted CustRefs:', custRefs);

        if (custRefs && custRefs.length > 0) {
          queryParams.CustomerReferences = custRefs;
          console.log('Added CustomerReferences to queryParams:', custRefs);
        } else {
          console.log('No CustomerReferences to add');
        }
      } catch (e) {
        console.error('Error processing CustRefs:', e);
      }

      // 3. Zpracování DateFrom - specificky
      try {
        console.log('=== Processing DateFrom ===');
        const dateFrom = extractValue(xml, 'Filter.DateFrom');
        console.log('Extracted DateFrom:', dateFrom);

        if (dateFrom) {
          const formattedDate = formatDateToYYYYMMDD(dateFrom);
          queryParams.DateFrom = formattedDate;
          console.log('Added DateFrom to queryParams:', formattedDate);
        } else {
          console.log('No DateFrom to add');
        }
      } catch (e) {
        console.error('Error processing DateFrom:', e);
      }

      // 4. Zpracování DateTo - specificky
      try {
        console.log('=== Processing DateTo ===');
        const dateTo = extractValue(xml, 'Filter.DateTo');
        console.log('Extracted DateTo:', dateTo);

        if (dateTo) {
          const formattedDate = formatDateToYYYYMMDD(dateTo);
          queryParams.DateTo = formattedDate;
          console.log('Added DateTo to queryParams:', formattedDate);
        } else {
          console.log('No DateTo to add');
        }
      } catch (e) {
        console.error('Error processing DateTo:', e);
      }

      // 5. Zpracování PackageStates - specificky
      try {
        console.log('=== Processing PackageStates ===');
        const packageStates = extractArrayValues(xml, 'Filter.PackageStates');
        console.log('Extracted PackageStates (array):', packageStates);

        // Přidáme také podporu pro jednotlivý stav
        const singlePackageState = extractValue(xml, 'Filter.PackageState');
        console.log('Extracted PackageState (single):', singlePackageState);

        const allPackageStates: string[] = [...packageStates];
        if (singlePackageState) {
          allPackageStates.push(singlePackageState);
        }

        if (allPackageStates.length > 0) {
          queryParams.ShipmentStates = allPackageStates;
          console.log('Added ShipmentStates to queryParams:', allPackageStates);
        } else {
          console.log('No ShipmentStates to add');
        }
      } catch (e) {
        console.error('Error processing PackageStates:', e);
      }

      // 6. Zpracování Invoice parametru - specificky
      try {
        console.log('=== Processing Invoice ===');
        const invoice = extractValue(xml, 'Filter.Invoice');
        console.log('Extracted Invoice:', invoice);

        if (invoice) {
          queryParams.Invoice = invoice;
          console.log('Added Invoice to queryParams:', invoice);
        } else {
          console.log('No Invoice to add');
        }
      } catch (e) {
        console.error('Error processing Invoice:', e);
      }

      // 7. Zpracování RoutingCode parametru
      try {
        console.log('=== Processing RoutingCode ===');
        const routingCode = extractValue(xml, 'Filter.RoutingCode');
        console.log('Extracted RoutingCode:', routingCode);

        if (routingCode) {
          queryParams.RoutingCode = routingCode;
          console.log('Added RoutingCode to queryParams:', routingCode);
        } else {
          console.log('No RoutingCode to add');
        }
      } catch (e) {
        console.error('Error processing RoutingCode:', e);
      }

      // 8. Zpracování SenderCity parametru
      try {
        console.log('=== Processing SenderCity ===');
        const senderCity = extractValue(xml, 'Filter.SenderCity');
        console.log('Extracted SenderCity:', senderCity);

        if (senderCity) {
          queryParams.SenderCity = senderCity;
          console.log('Added SenderCity to queryParams:', senderCity);
        } else {
          console.log('No SenderCity to add');
        }
      } catch (e) {
        console.error('Error processing SenderCity:', e);
      }

      // 9. Zpracování RecipientCity parametru
      try {
        console.log('=== Processing RecipientCity ===');
        const recipientCity = extractValue(xml, 'Filter.RecipientCity');
        console.log('Extracted RecipientCity:', recipientCity);

        if (recipientCity) {
          queryParams.RecipientCity = recipientCity;
          console.log('Added RecipientCity to queryParams:', recipientCity);
        } else {
          console.log('No RecipientCity to add');
        }
      } catch (e) {
        console.error('Error processing RecipientCity:', e);
      }

      // 10. Zpracování ExternalNumber parametru
      try {
        console.log('=== Processing ExternalNumber ===');
        const externalNumber = extractValue(xml, 'Filter.ExternalNumber');
        console.log('Extracted ExternalNumber:', externalNumber);

        if (externalNumber) {
          queryParams.ExternalNumber = externalNumber;
          console.log('Added ExternalNumber to queryParams:', externalNumber);
        } else {
          console.log('No ExternalNumber to add');
        }
      } catch (e) {
        console.error('Error processing ExternalNumber:', e);
      }

      // 11. Zpracování IsReturnPackage parametru
      try {
        console.log('=== Processing IsReturnPackage ===');
        const isReturnPackage = extractValue(xml, 'Filter.IsReturnPackage');
        console.log('Extracted IsReturnPackage:', isReturnPackage);

        if (isReturnPackage) {
          // Převod na boolean
          queryParams.IsReturnPackage =
            isReturnPackage.toLowerCase() === 'true' ? 'true' : 'false';
          console.log(
            'Added IsReturnPackage to queryParams:',
            queryParams.IsReturnPackage
          );
        } else {
          console.log('No IsReturnPackage to add');
        }
      } catch (e) {
        console.error('Error processing IsReturnPackage:', e);
      }

      try {
        console.log('=== Processing InvNumbers ===');
        const invNumbers = extractArrayValues(xml, 'Filter.InvNumbers');
        console.log('Extracted InvNumbers:', invNumbers);

        if (invNumbers && invNumbers.length > 0) {
          queryParams.InvoiceNumbers = invNumbers;
          console.log('Added InvoiceNumbers to queryParams:', invNumbers);
        } else {
          console.log('No InvoiceNumbers to add');
        }
      } catch (e) {
        console.error('Error processing InvNumbers:', e);
      }

      // 12. Zpracování Sizes parametru
      try {
        console.log('=== Processing Sizes ===');

        // Sizes mohou být jako pole hodnot
        const sizes = extractArrayValues(xml, 'Filter.Sizes');
        console.log('Extracted Sizes (array):', sizes);

        // Případně také jako jednotlivá hodnota
        const singleSize = extractValue(xml, 'Filter.Size');
        console.log('Extracted Size (single):', singleSize);

        const allSizes: string[] = [...sizes];
        if (singleSize) {
          allSizes.push(singleSize);
        }

        if (allSizes.length > 0) {
          queryParams.Sizes = allSizes;
          console.log('Added Sizes to queryParams:', allSizes);
        } else {
          console.log('No Sizes to add');
        }
      } catch (e) {
        console.error('Error processing Sizes:', e);
      }

      // 13. Zpracování SubjectId parametru
      try {
        console.log('=== Processing SubjectId ===');
        const subjectId = extractValue(xml, 'SubjectId');
        console.log('Extracted SubjectId:', subjectId);

        if (subjectId) {
          // Místo přidání do restOutput.notes použij lokální notes
          notes.push({
            type: 'warning',
            parameter: 'SubjectId',
            message:
              'Parametr SubjectId nemá ekvivalent v CPL API a bude ignorován.',
          });
          console.log(
            'UPOZORNĚNÍ: SubjectId nemá ekvivalent v CPL API a bude ignorován.'
          );
        }
      } catch (e) {
        console.error('Error processing SubjectId:', e);
      }

      // Zpracování StatusLang parametru
      console.log('=== Processing StatusLang - NEW VERSION ===');
      try {
        // Zkusíme přímo hledat tag v XML bez ohledu na cestu
        const statusLangMatch = xml.match(
          /<v1:StatusLang[^>]*>([^<]*)<\/v1:StatusLang>/i
        );
        console.log('StatusLang match result:', statusLangMatch);

        if (statusLangMatch && statusLangMatch[1]) {
          const statusLangValue = statusLangMatch[1].trim();
          console.log('FOUND StatusLang value:', statusLangValue);

          // VŽDY přidáme upozornění, když najdeme StatusLang
          notes.push({
            type: 'warning',
            parameter: 'StatusLang',
            message:
              'Parametr StatusLang nemá ekvivalent v CPL API a bude ignorován.',
          });
          console.log('Added warning about StatusLang');
        } else if (xml.includes('StatusLang')) {
          console.log(
            'StatusLang string found in XML, but value not extracted'
          );
          notes.push({
            type: 'warning',
            parameter: 'StatusLang',
            message:
              'Parametr StatusLang byl detekován, ale nemá ekvivalent v CPL API a bude ignorován.',
          });
          console.log('Added warning about detected StatusLang');
        } else {
          console.log('No StatusLang found in XML');
        }
      } catch (error) {
        console.error('Error processing StatusLang:', error);
      }

      // 15. Zpracování VariableSymbolsCOD parametru
      try {
        console.log('=== Processing VariableSymbolsCOD ===');
        const variableSymbolsCOD = extractValue(xml, 'VariableSymbolsCOD');
        console.log('Extracted VariableSymbolsCOD:', variableSymbolsCOD);

        if (variableSymbolsCOD) {
          queryParams.VariableSymbolsCOD = variableSymbolsCOD;
          console.log(
            'Added VariableSymbolsCOD to queryParams:',
            variableSymbolsCOD
          );
        }
      } catch (e) {
        console.error('Error processing VariableSymbolsCOD:', e);
      }

      // Výpis kompletních query parametrů pro kontrolu
      console.log(
        '=== Final queryParams ===',
        JSON.stringify(queryParams, null, 2)
      );

      // Sestavení finálního query stringu pro kontrolu
      const finalQueryString = constructQueryString(queryParams);
      console.log('=== Final query string ===', finalQueryString);
      console.log('Poznámky před výstupem:', JSON.stringify(notes, null, 2));
      console.log(
        'Výsledné queryParams:',
        JSON.stringify(queryParams, null, 2)
      );
      console.log('========== KONEC handleGetPackages ==========');

      // Nastavení výsledku pro UI
      setRestOutput({
        success: true,
        operation: 'GetPackages',
        method: 'GET',
        path: '/shipment',
        queryParams: queryParams,
        body: null,
        notes: notes.length > 0 ? notes : undefined,
      });
    } catch (error: any) {
      console.error('Chyba zpracování GetPackages:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování GetPackages: ${error.message}`,
      });
    }
  };

  // NOVÁ METODA: Zpracování CancelPackage (storno zásilky)
  const handleCancelPackage = (xml: string) => {
    try {
      // Extrakce čísla zásilky - povinné
      const packNumber = extractValue(xml, 'PackNumber');
      if (!packNumber) {
        setRestOutput({
          success: false,
          error: 'Chybí povinné číslo zásilky (PackNumber)',
        });
        return;
      }

      // Extrakce poznámky - volitelné
      const note = extractValue(xml, 'Note');

      // V REST API je číslo zásilky součástí URL, poznámka je v těle
      const body = note ? { note } : {};

      setRestOutput({
        success: true,
        operation: 'CancelPackage',
        method: 'POST',
        path: `/shipment/${packNumber}/cancel`,
        body: body,
      });
    } catch (error: any) {
      console.error('Chyba zpracování CancelPackage:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování CancelPackage: ${error.message}`,
      });
    }
  };

  // NOVÁ METODA: Zpracování UpdatePackage (aktualizace kontaktů zásilky)
  const handleUpdatePackage = (xml: string) => {
    try {
      // Extrakce čísla zásilky - povinné
      const packNumber = extractValue(xml, 'PackNumber');
      if (!packNumber) {
        setRestOutput({
          success: false,
          error: 'Chybí povinné číslo zásilky (PackNumber)',
        });
        return;
      }

      // Extrakce nových kontaktních údajů
      // V SOAP může být více polí, v REST API jsou jen telefon, email a poznámka
      const body: {
        recipientContact: { phone?: string; email?: string };
        note?: string;
      } = {
        recipientContact: {},
      };

      // Telefon příjemce
      const recipientPhone = extractNestedValue(xml, 'Recipient', 'Phone');
      if (recipientPhone) {
        body.recipientContact.phone = recipientPhone;
      }

      // Email příjemce
      const recipientEmail = extractNestedValue(xml, 'Recipient', 'Email');
      if (recipientEmail) {
        body.recipientContact.email = recipientEmail;
      }

      // Poznámka k aktualizaci
      const note = extractValue(xml, 'Note');
      if (note) {
        body.note = note;
      }

      // Kontrola, zda máme alespoň jeden kontaktní údaj
      if (Object.keys(body.recipientContact).length === 0) {
        setRestOutput({
          success: false,
          error: 'Chybí kontaktní údaje pro aktualizaci (telefon nebo email)',
        });
        return;
      }

      setRestOutput({
        success: true,
        operation: 'UpdatePackage',
        method: 'POST',
        path: `/shipment/${packNumber}/redirect`,
        body: body,
      });
    } catch (error: any) {
      console.error('Chyba zpracování UpdatePackage:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování UpdatePackage: ${error.message}`,
      });
    }
  };

  // NOVÁ METODA: Zpracování GetOrders (sledování objednávek)
  const handleGetOrders = (xml: string) => {
    try {
      // Extrahujeme filter sekci
      const filter: OrderFilter = {};

      // Zpracování pole OrderNumbers[] - čísla objednávek
      const orderNumbers = extractArrayValues(xml, 'Filter.OrderNumbers');
      if (orderNumbers.length > 0) {
        filter.orderNumbers = orderNumbers;
      }

      // Zpracování pole CustRefs[] - zákaznické reference
      const custRefs = extractArrayValues(xml, 'Filter.CustRefs');
      if (custRefs.length > 0) {
        filter.custRefs = custRefs;
      }

      // Extrakce datumů
      const dateFrom = extractValue(xml, 'Filter.DateFrom');
      if (dateFrom) {
        filter.dateFrom = formatDateToYYYYMMDD(dateFrom);
      }

      const dateTo = extractValue(xml, 'Filter.DateTo');
      if (dateTo) {
        filter.dateTo = formatDateToYYYYMMDD(dateTo);
      }

      // NOVÁ ČÁST: Extrakce stavu objednávky - může být jak pole, tak i jednotlivý element
      const orderStates: string[] = [];

      // Zkusíme extrahovat jako pole
      const orderStatesArray = extractArrayValues(xml, 'Filter.OrderStates');
      if (orderStatesArray.length > 0) {
        orderStates.push(...orderStatesArray);
      }

      // Zkusíme extrahovat jako jednotlivý element
      const singleOrderState = extractValue(xml, 'Filter.OrderState');
      if (singleOrderState) {
        orderStates.push(singleOrderState);
      }

      if (orderStates.length > 0) {
        filter.orderStates = orderStates;
      }

      // Výchozí hodnoty pro REST API
      const defaultLimit = 1000;
      const defaultOffset = 0;

      // Sestavení REST query parametrů
      const queryParams: Record<string, string | string[]> = {
        Limit: defaultLimit.toString(),
        Offset: defaultOffset.toString(),
      };

      if (filter.orderNumbers && filter.orderNumbers.length > 0) {
        queryParams.OrderNumbers = filter.orderNumbers;
      }

      if (filter.custRefs && filter.custRefs.length > 0) {
        queryParams.CustomerReferences = filter.custRefs;
      }

      if (filter.dateFrom) {
        queryParams.DateFrom = filter.dateFrom;
      }

      if (filter.dateTo) {
        queryParams.DateTo = filter.dateTo;
      }

      if (filter.orderStates && filter.orderStates.length > 0) {
        queryParams.OrderStates = filter.orderStates;
      }

      setRestOutput({
        success: true,
        operation: 'GetOrders',
        method: 'GET',
        path: '/order',
        queryParams: queryParams,
        body: null, // GET nemá body
      });
    } catch (error: any) {
      console.error('Chyba zpracování GetOrders:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování GetOrders: ${error.message}`,
      });
    }
  };

  // NOVÁ METODA: Zpracování CancelOrder (storno objednávky)
  const handleCancelOrder = (xml: string) => {
    try {
      // Extrakce čísla objednávky nebo zákaznické reference
      const orderNumber = extractValue(xml, 'OrderNumber');
      const custRef = extractValue(xml, 'CustRef');

      if (!orderNumber && !custRef) {
        setRestOutput({
          success: false,
          error: 'Chybí identifikace objednávky (OrderNumber nebo CustRef)',
        });
        return;
      }

      // Extrakce poznámky - volitelné
      const note = extractValue(xml, 'Note');

      // V REST API je vše jako query parametry
      const queryParams: Record<string, string> = {};

      if (orderNumber) {
        queryParams.orderNumber = orderNumber;
      }

      if (custRef) {
        queryParams.customerReference = custRef;
      }

      if (note) {
        queryParams.note = note;
      }

      setRestOutput({
        success: true,
        operation: 'CancelOrder',
        method: 'POST',
        path: '/order/cancel',
        queryParams: queryParams,
        body: {}, // POST, ale prázdné tělo
      });
    } catch (error: any) {
      console.error('Chyba zpracování CancelOrder:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování CancelOrder: ${error.message}`,
      });
    }
  };

  // OPRAVENÁ METODA: Zpracování GetParcelShops (výdejní místa) - přidána podpora pro Sizes
  const handleGetParcelShops = (xml: string) => {
    try {
      // Extrahujeme parametry filtru podle dokumentace
      const accessPointType = extractValue(xml, 'Filter.AccessPointType');
      const activeCardPayment = extractValue(xml, 'Filter.ActiveCardPayment');
      const activeCashPayment = extractValue(xml, 'Filter.ActiveCashPayment');
      const city = extractValue(xml, 'Filter.City');
      const code = extractValue(xml, 'Filter.Code');
      const countryCode =
        extractValue(xml, 'Filter.CountryCode') ||
        extractValue(xml, 'v1:CountryCode');
      const latitude = extractValue(xml, 'Filter.Latitude');
      const longitude = extractValue(xml, 'Filter.Longitude');
      const radius = extractValue(xml, 'Filter.Radius');
      const zipCode = extractValue(xml, 'Filter.ZipCode');

      // Nově přidáno: extrakce Sizes
      const sizes = extractArrayValues(xml, 'Filter.Sizes');
      const singleSize = extractValue(xml, 'Filter.Size');
      console.log('Extracted Sizes (array):', sizes);
      console.log('Extracted Size (single):', singleSize);

      // Výchozí hodnoty pro REST API
      const defaultLimit = 1000;
      const defaultOffset = 0;

      // Sestavení REST query parametrů
      const queryParams: Record<string, string | string[]> = {
        Limit: defaultLimit.toString(),
        Offset: defaultOffset.toString(),
      };

      // Pomocná funkce pro převod na boolean hodnotu (podporuje true/false, 1/0)
      const convertToBoolean = (value: string | null): string | undefined => {
        if (!value) return undefined;

        // Převod na boolean
        if (value.toLowerCase() === 'true' || value === '1') {
          return 'true';
        } else if (value.toLowerCase() === 'false' || value === '0') {
          return 'false';
        }

        // Pokud není ani true/false ani 1/0, vrátíme původní hodnotu
        return value;
      };

      // Mapování parametrů SOAP na REST podle dokumentace
      if (accessPointType) {
        queryParams.AccessPointType = accessPointType;
      }

      // Použití vylepšené konverze pro boolean hodnoty
      const boolCardPayment = convertToBoolean(activeCardPayment);
      if (boolCardPayment) {
        queryParams.ActiveCardPayment = boolCardPayment;
      }

      const boolCashPayment = convertToBoolean(activeCashPayment);
      if (boolCashPayment) {
        queryParams.ActiveCashPayment = boolCashPayment;
      }

      if (city) {
        queryParams.City = city;
      }

      if (code) {
        queryParams.AccessPointCode = code; // V REST API se to jmenuje AccessPointCode
      }

      if (countryCode) {
        queryParams.CountryCode = countryCode;
      }

      if (latitude) {
        queryParams.Latitude = latitude;
      }

      if (longitude) {
        queryParams.Longitude = longitude;
      }

      if (radius) {
        queryParams.Radius = radius;
      }

      if (zipCode) {
        queryParams.ZipCode = zipCode;
      }

      // Nově přidáno: zpracování Sizes
      const allSizes: string[] = [...sizes];
      if (singleSize) {
        allSizes.push(singleSize);
      }

      if (allSizes.length > 0) {
        queryParams.Sizes = allSizes;
        console.log('Added Sizes to queryParams:', allSizes);
      }

      // Přidání ladícího výpisu
      console.log(
        '=== Final queryParams for GetParcelShops ===',
        JSON.stringify(queryParams, null, 2)
      );

      // Sestavení finálního query stringu pro kontrolu
      const finalQueryString = constructQueryString(queryParams);
      console.log(
        '=== Final query string for GetParcelShops ===',
        finalQueryString
      );

      setRestOutput({
        success: true,
        operation: 'GetParcelShops',
        method: 'GET',
        path: '/accessPoint',
        queryParams: queryParams,
        body: null, // GET nemá body
      });
    } catch (error: any) {
      console.error('Chyba zpracování GetParcelShops:', error);
      setRestOutput({
        success: false,
        error: `Chyba při zpracování GetParcelShops: ${error.message}`,
      });
    }
  };

  // Handler pro transformaci - AKTUALIZOVANÁ VERZE
  const handleTransform = () => {
    if (!soapInput.trim()) {
      setRestOutput({
        success: false,
        error:
          language === 'cs'
            ? 'Prosím, zadejte SOAP XML požadavek.'
            : 'Please enter a SOAP XML request.',
      });
      return;
    }
    try {
      console.log('--- Debug handleTransform ---');
      console.log('Testovaný SOAP Input:', JSON.stringify(soapInput));

      let operation: string | null = null;

      // Detekce SOAP operace - rozšířeno o nové operace
      const isCreatePackages = /<\s*(\w+:)?CreatePackages[^>]*>/i.test(
        soapInput
      );
      const isCreateOrders = /<\s*(\w+:)?CreateOrders[^>]*>/i.test(soapInput);
      const isCreatePickupOrders = /<\s*(\w+:)?CreatePickupOrders[^>]*>/i.test(
        soapInput
      );
      const isGetPackages = /<\s*(\w+:)?GetPackages[^>]*>/i.test(soapInput);
      const isCancelPackage = /<\s*(\w+:)?CancelPackage[^>]*>/i.test(soapInput);
      const isUpdatePackage = /<\s*(\w+:)?UpdatePackage[^>]*>/i.test(soapInput);
      const isGetOrders = /<\s*(\w+:)?GetOrders[^>]*>/i.test(soapInput);
      const isCancelOrder = /<\s*(\w+:)?CancelOrder[^>]*>/i.test(soapInput);
      const isGetParcelShops = /<\s*(\w+:)?GetParcelShops[^>]*>/i.test(
        soapInput
      );

      console.log('Test <CreatePackages> výsledek:', isCreatePackages);
      console.log('Test <CreateOrders> výsledek:', isCreateOrders);
      console.log('Test <GetPackages> výsledek:', isGetPackages);
      console.log('Test <CancelPackage> výsledek:', isCancelPackage);
      console.log('Test <UpdatePackage> výsledek:', isUpdatePackage);
      console.log('Test <GetOrders> výsledek:', isGetOrders);
      console.log('Test <CancelOrder> výsledek:', isCancelOrder);
      console.log('Test <GetParcelShops> výsledek:', isGetParcelShops);

      // Určení operace
      if (isCreatePackages) {
        operation = 'CreatePackages';
      } else if (isCreateOrders) {
        operation = 'CreateOrders';
      } else if (isCreatePickupOrders) {
        operation = 'CreatePickupOrders';
      } else if (isGetPackages) {
        operation = 'GetPackages';
      } else if (isCancelPackage) {
        operation = 'CancelPackage';
      } else if (isUpdatePackage) {
        operation = 'UpdatePackage';
      } else if (isGetOrders) {
        operation = 'GetOrders';
      } else if (isCancelOrder) {
        operation = 'CancelOrder';
      } else if (isGetParcelShops) {
        operation = 'GetParcelShops';
      }

      console.log('Detekovaná operace:', operation);

      if (!operation) {
        setRestOutput({
          success: false,
          error:
            language === 'cs'
              ? 'Nepodporovaná nebo nerozpoznaná operace (podporované operace: CreatePackages, CreateOrders, GetPackages, CancelPackage, UpdatePackage, GetOrders, CancelOrder, GetParcelShops).'
              : 'Unsupported or unrecognized operation (supported operations: CreatePackages, CreateOrders, GetPackages, CancelPackage, UpdatePackage, GetOrders, CancelOrder, GetParcelShops).',
        });
        console.log('Operace nerozpoznána, nastavuji chybu.');
        return;
      }

      // Volání příslušné metody podle detekované operace
      switch (operation) {
        case 'CreatePackages':
          console.log('Volám handleCreatePackages...');
          handleCreatePackages(soapInput);
          break;
        case 'CreateOrders':
          console.log('Volám handleCreateOrders...');
          handleCreateOrders(soapInput);
          break;
        case 'CreatePickupOrders':
          console.log('Volám handleCreatePickupOrders...');
          handleCreatePickupOrders(soapInput);
          break;
        case 'GetPackages':
          console.log('Volám handleGetPackages...');
          handleGetPackages(soapInput);
          break;
        case 'CancelPackage':
          console.log('Volám handleCancelPackage...');
          handleCancelPackage(soapInput);
          break;
        case 'UpdatePackage':
          console.log('Volám handleUpdatePackage...');
          handleUpdatePackage(soapInput);
          break;
        case 'GetOrders':
          console.log('Volám handleGetOrders...');
          handleGetOrders(soapInput);
          break;
        case 'CancelOrder':
          console.log('Volám handleCancelOrder...');
          handleCancelOrder(soapInput);
          break;
        case 'GetParcelShops':
          console.log('Volám handleGetParcelShops...');
          handleGetParcelShops(soapInput);
          break;
        default:
          // Nemělo by nastat díky předchozí kontrole
          setRestOutput({
            success: false,
            error:
              language === 'cs'
                ? 'Neimplementovaná operace'
                : 'Unimplemented operation',
          });
      }
    } catch (error: any) {
      setRestOutput({
        success: false,
        error:
          language === 'cs'
            ? `Chyba při transformaci: ${error.message}`
            : `Transformation error: ${error.message}`,
      });
      console.error('Chyba transformace:', error);
    }
  };

  // Reset formuláře převodníku
  const resetConverterForm = () => {
    setSoapInput('');
    setRestOutput(null);
  };

  // Renderování výstupu pro REST

  // Zde by byl vrácen JSX komponenty
  return (
    // Použití Tailwind tříd pro hlavní kontejner
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-0 mb-8 font-sans">
      {/* Hlavička */}
      <div className="mb-8 pb-4 border-b border-gray-200">
        {/* Řádek 1: Logo, Verze a Přepínač */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <img src={LogoPPL} alt="PPL Logo" className="h-10 md:h-12" />
          </div>
          <div className="flex flex-col items-end">
            {/* Verze nahoře nad přepínačem jazyka */}
            <span className="text-xs text-gray-500 mb-2">
              {APP_VERSION} ({APP_BUILD_DATE})
            </span>

            <button
              className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700"
              onClick={toggleLanguage}
            >
              <Globe size={16} />
              {language === 'cs' ? 'EN' : 'CZ'}
            </button>
          </div>
        </div>
        {/* Řádek 2: Nadpis */}
        <h1 className="text-2xl md:text-2xl font-bold text-gray-800 text-center">
          {t('title')}
        </h1>
      </div>

      {/* Navigace Záložek (kombinace, přidány 'examples', 'faq', 'converter') */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6 relative">
        {/* Indikátor pod aktivní záložkou */}
        <div
          className="absolute bottom-[-1px] h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
          style={indicatorStyle}
        />
        {/* Mapování přes všechny definované záložky */}
        {(Object.keys(tabRefs) as TabName[]).map((tabId) => (
          <button
            key={tabId}
            ref={tabRefs[tabId]}
            className={`px-3 py-3 md:px-4 font-medium text-sm md:text-base whitespace-nowrap focus:outline-none ${
              activeTab === tabId
                ? 'text-blue-600' // Aktivní záložka
                : 'text-gray-600 hover:text-blue-600' // Neaktivní záložka
            }`}
            onClick={() => setActiveTab(tabId)}
          >
            {/* Pěknější názvy záložek */}
            {t(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* Vyhledávací panel (zobrazí se jen pro některé záložky) */}
      {['endpoints', 'fields', 'differences'].includes(activeTab) && (
        <div className="flex flex-wrap items-center mb-6 gap-4">
          <div className="relative flex-grow max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={`${t('searchPlaceholder')} "${t(
                `tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
              )}"`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* --- Obsah jednotlivých záložek --- */}

      {/* Obsah záložky Mapování endpointů */}
      {activeTab === 'endpoints' && (
        <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
          {/* Tabulka endpointů s vylepšeným stylem a onClick */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Použití Tailwind tříd pro záhlaví */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t('soapColumn')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t('restColumn')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                >
                  {t('categoryColumn')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4"
                >
                  {t('differencesColumn')}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t('detailsButton')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    {t('noResultsFound')} '{searchTerm}'.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep: Endpoint, index: number) => {
                  // Najdi odpovídající fieldMapping ID
                  const mappingId = Object.keys(apiData.fieldMappings).find(
                    (key) => {
                      const mapping =
                        apiData.fieldMappings[
                          key as keyof typeof apiData.fieldMappings
                        ];
                      return (
                        mapping.soapOperation === ep.soapOperation &&
                        mapping.restEndpoint === ep.restEndpoint
                      );
                    }
                  );
                  const hasDetail = !!mappingId;

                  return (
                    <tr
                      key={index}
                      id={`endpoint-row-${index}`}
                      className={`group hover:bg-blue-50 transition-colors duration-150 ${
                        hasDetail ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (mappingId) {
                          // Přidáme malé zpoždění pro animaci
                          const row = document.getElementById(
                            `endpoint-row-${index}`
                          );
                          if (row) row.classList.add('bg-blue-100');
                          setTimeout(() => {
                            setSelectedFieldMapping(mappingId);
                            setActiveTab('fields');
                            if (row) row.classList.remove('bg-blue-100');
                          }, 150);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-normal align-top">
                        <div className="text-sm font-semibold text-gray-900">
                          {ep.soapOperation}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ep.soapDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal align-top">
                        <div className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                          <span>{ep.restEndpoint}</span>
                          {ep.docUrl && (
                            <a
                              href={
                                ep.docUrl.startsWith('http') ? ep.docUrl : '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                              title="Dokumentace"
                            >
                              <ExternalLink size={14} strokeWidth={2} />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ep.restDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 align-top hidden md:table-cell">
                        {language === 'cs'
                          ? apiData.categories.find((c) => c.id === ep.category)
                              ?.name
                          : apiData.categories.find((c) => c.id === ep.category)
                              ?.nameEn}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 align-top max-w-xs">
                        <div className="break-words">
                          {language === 'cs'
                            ? ep.mainDifferences
                            : ep.mainDifferencesEn || ep.mainDifferences}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                        {hasDetail && (
                          <div className="flex items-center justify-end text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <span className="text-xs mr-1 hidden lg:inline">
                              {t('detailsButton')}
                            </span>
                            <ArrowRight size={16} strokeWidth={2} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Obsah záložky Porovnání polí */}
      {activeTab === 'fields' && (
        <div>
          {!selectedFieldMapping ? (
            <div className="text-center py-12 text-gray-500">
              <Info size={24} className="mx-auto mb-2 text-gray-400" />
              {t('selectEndpointFirst')}{' '}
              <button
                onClick={() => setActiveTab('endpoints')}
                className="text-blue-600 hover:underline font-medium"
              >
                {t('tabEndpoints')}
              </button>
              .
            </div>
          ) : (
            (() => {
              const mapping =
                apiData.fieldMappings[
                  selectedFieldMapping as keyof typeof apiData.fieldMappings
                ];
              if (!mapping)
                return (
                  <div className="text-center py-8 text-red-500">
                    <AlertCircle size={18} className="inline mr-1" />{' '}
                    {t('mappingNotFound')}
                  </div>
                );
              const filteredFields = getFilteredFields(selectedFieldMapping);
              return (
                <>
                  {/* Hlavička porovnání polí */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                      {language === 'cs' ? mapping.title : mapping.titleEn}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'cs'
                        ? mapping.description
                        : mapping.descriptionEn}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-600 mr-1">
                          {t('soapColumn')}:
                        </span>
                        <span className="text-gray-800 font-mono">
                          {mapping.soapOperation}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-600 mr-1">
                          {t('restColumn')}:
                        </span>
                        <span className="text-blue-700 font-mono flex items-center gap-1">
                          {mapping.restEndpoint}
                          {mapping.docUrl && (
                            <a
                              href={
                                mapping.docUrl.startsWith('http')
                                  ? mapping.docUrl
                                  : '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="Dokumentace"
                            >
                              <ExternalLink size={14} strokeWidth={2} />
                            </a>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabulka porovnání polí */}
                  <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('soapColumn')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('restColumn')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('dataType')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('required')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('maxLength')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('description')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFields.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              {t('noResultsFound')} '{searchTerm}'.
                            </td>
                          </tr>
                        ) : (
                          filteredFields.map((field: Field, idx: number) => {
                            const diff = highlightDifferences(field);
                            return (
                              <tr
                                key={idx}
                                className={`${
                                  diff.hasAnyDiff
                                    ? 'bg-yellow-50 hover:bg-yellow-100'
                                    : 'hover:bg-gray-50'
                                } transition-colors duration-150`}
                              >
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 align-top font-mono">
                                  {field.soapField}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-700 align-top font-mono">
                                  {field.restField}
                                </td>
                                <td
                                  className={`px-4 py-2 whitespace-nowrap text-sm align-top ${
                                    diff.hasTypeDiff
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {field.soapType}
                                  {diff.hasAnyDiff ? (
                                    <span className="text-red-600 mx-1">→</span>
                                  ) : (
                                    <span className="text-gray-400 mx-1">
                                      →
                                    </span>
                                  )}
                                  {field.restType}
                                </td>
                                <td
                                  className={`px-4 py-2 whitespace-nowrap text-sm align-top ${
                                    diff.hasRequiredDiff
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {field.soapRequired ? t('yes') : t('no')}
                                  {diff.hasAnyDiff ? (
                                    <span className="text-red-600 mx-1">→</span>
                                  ) : (
                                    <span className="text-gray-400 mx-1">
                                      →
                                    </span>
                                  )}
                                  {field.restRequired ? t('yes') : t('no')}
                                </td>
                                <td
                                  className={`px-4 py-2 whitespace-nowrap text-sm align-top ${
                                    diff.hasLengthDiff
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {field.soapLength}
                                  {diff.hasAnyDiff ? (
                                    <span className="text-red-600 mx-1">→</span>
                                  ) : (
                                    <span className="text-gray-400 mx-1">
                                      →
                                    </span>
                                  )}
                                  {field.restLength}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500 align-top whitespace-normal">
                                  {language === 'cs'
                                    ? field.notes
                                    : field.notesEn || field.notes}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Vysvětlivky */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                    <div className="flex items-center mb-2">
                      {' '}
                      <Info
                        size={16}
                        className="text-gray-400 mr-2 flex-shrink-0"
                      />{' '}
                      <span className="font-medium text-gray-700">
                        {t('legendTitle')}
                      </span>{' '}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full mr-2"></span>
                        {t('legendYellowRow')}
                      </div>
                      <div className="flex items-center">
                        <span className="text-red-600 font-semibold mr-1">
                          Červený text
                        </span>{' '}
                        = {t('legendRedText')}
                      </div>
                      <div className="flex items-center">
                        <span className="text-red-600 mx-1">→</span>
                        {t('legendArrow')}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}

      {/* Obsah záložky Obecné rozdíly */}
      {activeTab === 'differences' && (
        <div className="space-y-4">
          {/* Zobrazení obecných rozdílů s možností rozbalení */}
          {apiData.generalDifferences
            .filter(
              (diff) =>
                !searchTerm ||
                (language === 'cs'
                  ? diff.category
                  : diff.categoryEn || diff.category
                )
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                (language === 'cs'
                  ? diff.soapApproach
                  : diff.soapApproachEn || diff.soapApproach
                )
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                (language === 'cs'
                  ? diff.restApproach
                  : diff.restApproachEn || diff.restApproach
                )
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                (diff.soapExample &&
                  diff.soapExample
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) ||
                (diff.restExample &&
                  diff.restExample
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()))
            )
            .map((diff, index) => (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                  diff.importance === 'high'
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
                  onClick={() => toggleDifference(index)}
                >
                  <h3 className="text-base md:text-lg font-medium text-gray-900 flex items-center">
                    {diff.importance === 'high' && (
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 flex-shrink-0"></span>
                    )}
                    {language === 'cs'
                      ? diff.category
                      : diff.categoryEn || diff.category}
                  </h3>
                  <span className="text-gray-500">
                    {expandedDifferences.includes(index) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </span>
                </button>

                {expandedDifferences.includes(index) && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1 text-sm">
                          {t('soapColumn')}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {language === 'cs'
                            ? diff.soapApproach
                            : diff.soapApproachEn || diff.soapApproach}
                        </p>
                        <div className="relative group/copy">
                          <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto font-mono max-h-60">
                            {diff.soapExample || 'N/A'}
                          </pre>
                          {diff.soapExample && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  diff.soapExample,
                                  `soap-${index}`
                                );
                              }}
                              className={`absolute top-1 right-1 ${
                                copiedButtonId === `soap-${index}`
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                              } p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                              title={t('copy')}
                            >
                              {copiedButtonId === `soap-${index}` ? (
                                <Check size={12} />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1 text-sm">
                          {t('restColumn')}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {language === 'cs'
                            ? diff.restApproach
                            : diff.restApproachEn || diff.restApproach}
                        </p>
                        <div className="relative group/copy">
                          <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto font-mono max-h-60">
                            {diff.restExample || 'N/A'}
                          </pre>
                          {diff.restExample && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  diff.restExample,
                                  `rest-${index}`
                                );
                              }}
                              className={`absolute top-1 right-1 ${
                                copiedButtonId === `rest-${index}`
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                              } p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                              title={t('copy')}
                            >
                              {copiedButtonId === `rest-${index}` ? (
                                <Check size={12} />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          {/* Sekce doporučení pro migraci */}
          <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              {t('migrationRecommendations')}
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-800">
                  {t('authMigration')}
                </h4>
                <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                  {(language === 'cs'
                    ? apiData.translations.cs.authMigrationDesc
                    : apiData.translations.en.authMigrationDesc
                  ).map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">
                  {t('requestsMigration')}
                </h4>
                <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                  {(language === 'cs'
                    ? apiData.translations.cs.requestsMigrationDesc
                    : apiData.translations.en.requestsMigrationDesc
                  ).map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">
                  {t('endpointsMigration')}
                </h4>
                <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                  {(language === 'cs'
                    ? apiData.translations.cs.endpointsMigrationDesc
                    : apiData.translations.en.endpointsMigrationDesc
                  ).map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Obsah záložky Příklady */}
      {activeTab === 'examples' && (
        <div>
          {/* Zobrazení příkladů (upraveno) */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('examplesTitle')}
          </h2>
          <p className="mb-6 text-sm text-gray-600">{t('examplesDesc')}</p>
          <div className="space-y-6">
            {apiData.apiExamples.map((example) => (
              <div
                key={example.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
              >
                <div className="px-4 py-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {language === 'cs'
                        ? example.category
                        : example.categoryEn || example.category}
                    </span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {t('complexity')}{' '}
                      {example.complexity === 'complex'
                        ? t('complexityHigh')
                        : example.complexity === 'medium'
                        ? t('complexityMedium')
                        : t('complexityLow')}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-gray-900">
                    {language === 'cs'
                      ? example.title
                      : example.titleEn || example.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {language === 'cs'
                      ? example.description
                      : example.descriptionEn || example.description}
                  </p>
                  {example.endpoint && (
                    <div className="mt-2 flex items-center text-xs text-blue-600 font-mono">
                      <span
                        className={`font-bold mr-1 ${
                          example.method === 'POST'
                            ? 'text-green-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {example.method}
                      </span>
                      <span>{example.endpoint}</span>
                    </div>
                  )}
                </div>
                {example.requestBody && (
                  <div className="px-4 pb-4">
                    <div className="relative group/copy">
                      <pre className="text-[11px] bg-gray-800 text-white p-3 rounded overflow-x-auto font-mono max-h-96">
                        {example.requestBody}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            example.requestBody,
                            `ex-${example.id}`
                          )
                        }
                        className={`absolute top-1 right-1 ${
                          copiedButtonId === `ex-${example.id}`
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                        } p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                        title={t('copyCode')}
                      >
                        {copiedButtonId === `ex-${example.id}` ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obsah záložky FAQ */}
      {activeTab === 'faq' && (
        <div>
          {/* Zobrazení FAQ */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('faqTitle')}
          </h2>
          <p className="mb-6 text-sm text-gray-600">{t('faqDesc')}</p>
          <div className="space-y-3">
            {apiData.faqItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                <button
                  className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
                  onClick={() =>
                    setExpandedFaq((prev) =>
                      prev === item.id ? null : item.id
                    )
                  }
                >
                  <span className="text-sm font-medium text-gray-900">
                    {language === 'cs'
                      ? item.question
                      : item.questionEn || item.question}
                  </span>
                  <span className="ml-4 text-gray-400 flex-shrink-0">
                    {expandedFaq === item.id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </span>
                </button>
                {expandedFaq === item.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                    {/* Použití `whitespace-pre-line` pro zachování odřádkování v odpovědi */}
                    <p className="text-xs text-gray-600 whitespace-pre-line">
                      {language === 'cs'
                        ? item.answer
                        : item.answerEn || item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obsah záložky Převodník SOAP na REST */}
      {activeTab === 'converter' && (
        <div className="mt-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('converterTitle')}
          </h2>

          {/* Tabulka podporovaných operací */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                {t('supportedOperations')}
              </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t('soapColumn')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t('restColumn')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                <tr
                  id="converter-CreatePackages"
                  className={`${
                    restOutput?.operation === 'CreatePackages'
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'CreatePackages' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    CreatePackages
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    POST /shipment/batch
                  </td>
                </tr>
                <tr
                  id="converter-CreateOrders"
                  className={`${
                    restOutput?.operation === 'CreateOrders'
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'CreateOrders' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    CreateOrders
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    POST /order/batch
                  </td>
                </tr>
                <tr
                  id="converter-CreatePickupOrders"
                  className={`${
                    restOutput?.operation === 'CreatePickupOrders'
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'CreatePickupOrders' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    CreatePickupOrders
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    POST /order/batch
                  </td>
                </tr>
                <tr
                  id="converter-GetPackages"
                  className={`${
                    restOutput?.operation === 'GetPackages' ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'GetPackages' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    GetPackages
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    GET /shipment
                  </td>
                </tr>
                <tr
                  id="converter-CancelPackage"
                  className={`${
                    restOutput?.operation === 'CancelPackage'
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'CancelPackage' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    CancelPackage
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    POST /shipment/{'{shipmentNumber}'}/cancel
                  </td>
                </tr>
                <tr
                  id="converter-UpdatePackage"
                  className={`${
                    restOutput?.operation === 'UpdatePackage'
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'UpdatePackage' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    UpdatePackage
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    POST /shipment/{'{shipmentNumber}'}/redirect
                  </td>
                </tr>
                <tr
                  id="converter-GetOrders"
                  className={`${
                    restOutput?.operation === 'GetOrders' ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'GetOrders' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    GetOrders
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    GET /order
                  </td>
                </tr>
                <tr
                  id="converter-CancelOrder"
                  className={`${
                    restOutput?.operation === 'CancelOrder' ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'CancelOrder' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    CancelOrder
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    POST /order/cancel
                  </td>
                </tr>
                <tr
                  id="converter-GetParcelShops"
                  className={`${
                    restOutput?.operation === 'GetParcelShops'
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                    {restOutput?.operation === 'GetParcelShops' ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    GetParcelShops
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    GET /accessPoint
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Nastavení převodníku */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                {t('converterSettings')}
              </h3>
            </div>
            <div className="p-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <label
                    htmlFor="baseUrlInput"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('baseUrl')}
                  </label>
                  <input
                    id="baseUrlInput"
                    type="text"
                    className="input w-full p-2 border border-gray-300 rounded-md text-sm"
                    value={converterBaseUrl}
                    onChange={(e) => setConverterBaseUrl(e.target.value)}
                  />
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-700">
                  <strong>
                    {language === 'cs' ? 'Upozornění' : 'Warning'}:
                  </strong>{' '}
                  {t('converterWarning')}
                </div>
              </div>
            </div>
          </div>

          {/* Stav konverze - zobrazí se pouze při úspěšné konverzi */}
          {restOutput && restOutput.success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="px-4 py-3 flex items-center">
                <Check
                  size={20}
                  className="mr-3 text-green-600 flex-shrink-0"
                />
                <div>
                  <h3 className="text-sm font-semibold text-green-800">
                    {t('conversionSuccess')}
                  </h3>
                  <p className="text-xs text-green-700 mt-0.5">
                    {t('soapColumn')}{' '}
                    <span className="font-mono font-medium">
                      {restOutput.operation}
                    </span>{' '}
                    {t('operationConverted')}
                  </p>
                </div>
              </div>
              <div className="border-t border-green-200 px-4 py-3">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-700 w-16">
                      {t('method')}:
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        restOutput.method === 'POST'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {restOutput.method}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-700 w-16">
                      {t('endpoint')}:
                    </span>
                    <span className="text-xs font-mono overflow-x-auto flex-grow">
                      {`${converterBaseUrl}${restOutput.path}`}
                      <span className="text-blue-600 font-semibold">
                        {restOutput.queryParams &&
                        Object.keys(restOutput.queryParams).length > 0
                          ? constructQueryString(restOutput.queryParams)
                          : ''}
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  className="mt-2 text-xs flex items-center text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
                  onClick={() =>
                    copyToClipboard(
                      `${restOutput.method} ${converterBaseUrl}${
                        restOutput.path
                      }${
                        restOutput.queryParams
                          ? constructQueryString(restOutput.queryParams)
                          : ''
                      }`,
                      'rest-url'
                    )
                  }
                >
                  {copiedButtonId === 'rest-url' ? (
                    <Check size={14} className="mr-1" />
                  ) : (
                    <Copy size={14} className="mr-1" />
                  )}
                  {t('copyEndpoint')}
                </button>
              </div>
            </div>
          )}

          {/* Hlavní část převodníku - dva sloupce */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Levá strana: Vstup SOAP */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('soapRequest')}
                </h3>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={resetConverterForm}
                  disabled={!soapInput && !restOutput}
                >
                  {t('reset')}
                </button>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full min-h-[350px] p-3 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md resize-none"
                  value={soapInput}
                  onChange={(e) => setSoapInput(e.target.value)}
                  placeholder={t('enterSoapXml')}
                  spellCheck={false}
                />
                <button
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center text-sm font-medium"
                  onClick={handleTransform}
                  disabled={!soapInput.trim()}
                >
                  <ArrowRight size={18} className="mr-1" /> {t('transform')}
                </button>
              </div>
            </div>

            {/* Pravá strana: Výstup REST */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('restEquivalent')}
                </h3>
              </div>
              <div className="p-4">
                {/* ======================================================================= */}
                {/* ===== PŘESNĚ SEM VLOŽTE TENTO CONSOLE.LOG ===== */}
                {
                  <>
                    {console.log(
                      'POKUS O RENDER VÝSLEDKU: activeTab:',
                      activeTab,
                      '| restOutput existuje:',
                      !!restOutput,
                      '| restOutput.success JE:', // <--- PŘIDÁNO
                      restOutput ? restOutput.success : 'N/A', // <--- PŘIDÁNO
                      '| restOutput.notes existuje:',
                      !!(restOutput && restOutput.notes),
                      '| Počet notes:',
                      restOutput && restOutput.notes
                        ? restOutput.notes.length
                        : 'N/A'
                    )}
                  </>
                }
                {/* ======================================================================= */}

                {/* Podmíněné renderování výstupu */}
                {restOutput === null ? (
                  <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-6 min-h-[350px]">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">{t('resultWillAppear')}</p>
                      <p className="text-xs mt-2">{t('enterSoapAndClick')}</p>
                    </div>
                  </div>
                ) : !restOutput.success ? (
                  <div className="flex items-start bg-red-50 border border-red-200 rounded-md p-4 min-h-[350px]">
                    <AlertCircle
                      size={18}
                      className="mr-2 flex-shrink-0 text-red-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {t('conversionError')}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {restOutput.error}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[350px] flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-gray-700">
                        {t('jsonBody')}
                      </h4>
                      <button
                        className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(restOutput.body, null, 2),
                            'rest-body'
                          )
                        }
                      >
                        {copiedButtonId === 'rest-body' ? (
                          <Check size={14} className="mr-1" />
                        ) : (
                          <Copy size={14} className="mr-1" />
                        )}
                        {t('copyJson')}
                      </button>
                    </div>
                    {/* Skrolovatelný pre blok s podmíněným stylem */}
                    <div
                      className={`flex-grow border border-gray-200 rounded-md bg-gray-50 overflow-auto ${
                        restOutput && restOutput.body === null
                          ? 'opacity-75'
                          : ''
                      }`}
                    >
                      {' '}
                      {/* Přidána třída pro zprůhlednění */}
                      <pre
                        className={`p-3 text-xs font-mono ${
                          restOutput && restOutput.body === null
                            ? 'text-gray-500'
                            : ''
                        }`}
                      >
                        {' '}
                        {/* Přidána třída pro šedý text */}
                        {JSON.stringify(restOutput.body, null, 2)}
                      </pre>
                    </div>

                    {/* Nový blok pro vysvětlující text (zobrazí se jen pro GET s null body) */}
                    {restOutput &&
                      restOutput.body === null &&
                      restOutput.method === 'GET' && (
                        <p className="mt-3 p-3 text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-md">
                          <Info
                            size={16}
                            className="inline mr-2 text-blue-600"
                            style={{ verticalAlign: 'text-bottom' }}
                          />{' '}
                          {/* Upraveno verticalAlign pro lepší zarovnání ikony */}
                          {t('converterGetRequestNullBodyInfo')}{' '}
                          {/* Použití nového překladu */}
                        </p>
                      )}
                    {/* Skrolovatelný pre blok
                    <div className="flex-grow border border-gray-200 rounded-md bg-gray-50 overflow-auto">
                      <pre className="p-3 text-xs font-mono">
                        {JSON.stringify(restOutput.body, null, 2)}
                      </pre>
                    </div> */}
                    {/* === VLOŽTE NOVÝ KÓD PRO POZNÁMKY PŘESNĚ SEM === */}
                    {restOutput.notes && restOutput.notes.length > 0 && (
                      <div className="mt-4 border border-yellow-200 rounded-md bg-yellow-50 p-3">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          {language === 'cs'
                            ? 'Poznámky ke konverzi:'
                            : 'Conversion Notes:'}
                        </h4>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {restOutput.notes.map((note, index) => (
                            <li key={index} className="flex items-start">
                              {note.type === 'warning' && (
                                <AlertCircle
                                  size={14}
                                  className="mr-1 mt-0.5 flex-shrink-0 text-yellow-600"
                                />
                              )}
                              <span>
                                <strong>{note.parameter}:</strong>{' '}
                                {note.message}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* === KONEC NOVÉHO KÓDU PRO POZNÁMKY === */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {renderVersionInfo()}
    </div> // Konec hlavního kontejneru
  );
};

// Export komponenty
export default ApiComparisonConverter;
