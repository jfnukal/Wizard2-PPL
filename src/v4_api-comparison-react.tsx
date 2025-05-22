import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Info } from 'lucide-react';

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
};

// Definice dat pro API porovnání
const apiData = {
  // Kategorie API endpointů
  categories: [
    { id: 'shipment', name: 'Zásilky', description: 'Vytvoření a sledování zásilek' },
    { id: 'order', name: 'Objednávky', description: 'Správa objednávek přepravy' },
    { id: 'accesspoint', name: 'Výdejní místa', description: 'Práce s výdejními místy' },
    { id: 'codelist', name: 'Číselníky', description: 'Referenční data a číselníky' },
    { id: 'auth', name: 'Autentizace', description: 'Přihlášení a autorizace' },
  ],
  
  // Mapování SOAP operací na REST endpointy
  endpointMappings: [
    {
      category: 'shipment',
      soapOperation: 'CreatePackages',
      soapDescription: 'Vloží nové zásilky pro import a vytvoří štítky',
      restEndpoint: 'POST /shipment/batch + GET /shipment/batch/{batchId}/label',
      restDescription: 'Slouží k vytvoření zásilky a získání štítků',
      mainDifferences: 'REST API poskytuje více validačních pravidel, má jiný formát odpovědi a používá camelCase'
    },
    {
      category: 'shipment',
      soapOperation: 'GetPackages',
      soapDescription: 'Vrátí seznam zásilek dle zadaného filtru',
      restEndpoint: 'GET /shipment',
      restDescription: 'Slouží k získání informací (trackingu) k zásilce',
      mainDifferences: 'REST API používá query parametry místo komplexního filtru v těle'
    },
    {
      category: 'shipment',
      soapOperation: 'CancelPackage',
      soapDescription: 'Zrušení zásilky',
      restEndpoint: 'POST /shipment/{shipmentNumber}/cancel',
      restDescription: 'Možnost stornovat balík, pokud nebyl fyzicky poslán',
      mainDifferences: 'REST API využívá URL parametr pro identifikaci zásilky'
    },
    {
      category: 'shipment',
      soapOperation: 'UpdatePackage',
      soapDescription: 'Aktualizace údajů zásilky',
      restEndpoint: 'POST /shipment/{shipmentNumber}/redirect',
      restDescription: 'Možnost doplnit informace k balíku',
      mainDifferences: 'REST API poskytuje omezenější možnosti aktualizace'
    },
    {
      category: 'order',
      soapOperation: 'CreateOrders',
      soapDescription: 'Vytvoří objednávky přepravy',
      restEndpoint: 'POST /order/batch',
      restDescription: 'Slouží k vytvoření objednávky',
      mainDifferences: 'REST API má detailnější strukturu a explicitní kontroly délky polí'
    },
    {
      category: 'order',
      soapOperation: 'CreatePickupOrders',
      soapDescription: 'Vytvoří objednávky svozu',
      restEndpoint: 'POST /order/batch',
      restDescription: 'Slouží k vytvoření objednávky svozu',
      mainDifferences: 'V REST API je typ objednávky určen parametrem orderType'
    },
    {
      category: 'order',
      soapOperation: 'GetOrders',
      soapDescription: 'Vrátí seznam objednávek dle zadaného filtru',
      restEndpoint: 'GET /order',
      restDescription: 'Sledování stavu objednávek',
      mainDifferences: 'REST API používá query parametry místo komplexního filtru v těle'
    },
    {
      category: 'order',
      soapOperation: 'CancelOrder',
      soapDescription: 'Zrušení objednávky',
      restEndpoint: 'POST /order/cancel',
      restDescription: 'Zrušení objednání svozu nebo balíku z libovolné adresy',
      mainDifferences: 'REST API používá query parametry pro identifikaci objednávky'
    },
    {
      category: 'accesspoint',
      soapOperation: 'GetParcelShops',
      soapDescription: 'Vrátí seznam ParcelShopů',
      restEndpoint: 'GET /accessPoint',
      restDescription: 'Seznam výdejních míst',
      mainDifferences: 'REST API má rozšířené možnosti filtrování a detailnější strukturu'
    },
    {
      category: 'codelist',
      soapOperation: 'GetCodCurrency',
      soapDescription: 'Vrátí povolené měny pro dobírku',
      restEndpoint: 'GET /codelist/currency',
      restDescription: 'Číselník povolených měn',
      mainDifferences: 'REST API používá standardizovaný formát pro všechny číselníky'
    },
    {
      category: 'codelist',
      soapOperation: 'GetPackProducts',
      soapDescription: 'Vrátí seznam produktů',
      restEndpoint: 'GET /codelist/product',
      restDescription: 'Číselník produktů',
      mainDifferences: 'REST API používá standardizovaný formát pro všechny číselníky'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/ageCheck',
      restDescription: 'Číselník pro službu kontroly věku příjemce',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/externalNumber',
      restDescription: 'Číselník typů externích čísel',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'GetProductCountry',
      soapDescription: 'Vrátí země a produkty pro zákazníka',
      restEndpoint: 'GET /codelist/country',
      restDescription: 'Číselník zemí + povolení COD',
      mainDifferences: 'REST API poskytuje jednodušší strukturu'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/service',
      restDescription: 'Metoda pro získání poskytovaných služeb k zásilkám',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/servicePriceLimit',
      restDescription: 'Metoda pro získání minimálních a maximálních hodnot u služeb',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/shipmentPhase',
      restDescription: 'Fáze zásilky',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/status',
      restDescription: 'Statusy zásilky /shipment',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/validationMessage',
      restDescription: 'Chybové hlášení',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/proofOfIdentityType',
      restDescription: 'Typy osobních dokladů',
      mainDifferences: 'Dostupné pouze v REST API'
    },
    {
      category: 'auth',
      soapOperation: 'Login',
      soapDescription: 'Vrátí autentikační ticket',
      restEndpoint: 'OAuth2/JWT autentizace',
      restDescription: 'Standardní autentizace pomocí Bearer tokenu',
      mainDifferences: 'REST API používá standardní OAuth2/JWT mechanismus místo vlastního'
    }
  ],
// Detailní porovnání polí pro vybrané operace
  fieldMappings: {
    'shipment-create': {
      title: 'Vytvoření zásilky',
      description: 'Porovnání struktur pro vytvoření zásilky',
      soapOperation: 'CreatePackages',
      restEndpoint: 'POST /shipment/batch',
      fields: [
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky'
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
          notes: 'Typ produktu'
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
          notes: 'Poznámka k zásilce'
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
          notes: 'Kód depa'
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
          notes: 'Jméno odesílatele'
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
          notes: 'Doplňující jméno odesílatele'
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
          notes: 'Ulice odesílatele'
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
          notes: 'Město odesílatele'
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
          notes: 'PSČ odesílatele'
        },
        {
          soapField: 'Sender.Country',
          restField: 'sender.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2+',
          notes: 'Kód země odesílatele'
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
          notes: 'Kontaktní osoba odesílatele'
        },
        {
          soapField: 'Sender.Phone',
          restField: 'sender.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '30',
          notes: 'Telefon odesílatele'
        },
        {
          soapField: 'Sender.Email',
          restField: 'sender.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Email odesílatele'
        },
        {
          soapField: 'Recipient.Name',
          restField: 'recipient.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno příjemce'
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
          notes: 'Doplňující jméno příjemce'
        },
        {
          soapField: 'Recipient.Street',
          restField: 'recipient.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice příjemce'
        },
        {
          soapField: 'Recipient.City',
          restField: 'recipient.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město příjemce'
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
          notes: 'PSČ příjemce'
        },
        {
          soapField: 'Recipient.Country',
          restField: 'recipient.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2+',
          notes: 'Kód země příjemce'
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
          notes: 'Kontaktní osoba příjemce'
        },
        {
          soapField: 'Recipient.Phone',
          restField: 'recipient.phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '30',
          notes: 'Telefon příjemce'
        },
        {
          soapField: 'Recipient.Email',
          restField: 'recipient.email',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Email příjemce'
        },
        {
          soapField: 'PaymentInfo.CodPrice',
          restField: 'cashOnDelivery.codPrice',
          soapType: 'decimal',
          restType: 'double',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '12,4',
          notes: 'Částka dobírky'
        },
        {
          soapField: 'PaymentInfo.CodCurrency',
          restField: 'cashOnDelivery.codCurrency',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '3',
          notes: 'Měna dobírky'
        },
        {
          soapField: 'PaymentInfo.CodVarSym',
          restField: 'cashOnDelivery.codVarSym',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'Variabilní symbol dobírky'
        },
        {
          soapField: 'PaymentInfo.BankAccount',
          restField: 'cashOnDelivery.account',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '10',
          notes: 'Číslo účtu'
        },
        {
          soapField: 'PaymentInfo.BankCode',
          restField: 'cashOnDelivery.bankCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '4',
          notes: 'Kód banky'
        },
        {
          soapField: 'PaymentInfo.IBAN',
          restField: 'cashOnDelivery.iban',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'IBAN'
        },
        {
          soapField: 'PaymentInfo.Swift',
          restField: 'cashOnDelivery.swift',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'SWIFT/BIC'
        },
        {
          soapField: 'SpecDelivery.ParcelShopCode',
          restField: 'specificDelivery.parcelShopCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Kód výdejního místa'
        },
        {
          soapField: 'PackagesExtNums[].Code',
          restField: 'externalNumbers[].code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '4+',
          notes: 'Typ externího čísla'
        },
        {
          soapField: 'PackagesExtNums[].ExtNumber',
          restField: 'externalNumbers[].externalNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50+',
          notes: 'Hodnota externího čísla'
        },
        {
          soapField: 'PackageServices[].SvcCode',
          restField: 'services[].code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód služby'
        },
        {
          soapField: 'ReturnChannel.Type',
          restField: 'returnChannel.type',
          soapType: 'string',
          restType: 'enum',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'enum',
          notes: 'Typ návratového kanálu'
        },
        {
          soapField: 'ReturnChannel.Format',
          restField: 'labelSettings.format',
          soapType: 'string',
          restType: 'enum',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'enum',
          notes: 'Formát štítku'
        }
      ]
    },
    'tracking': {
      title: 'Sledování zásilky',
      description: 'Porovnání struktur pro získání informací o zásilce',
      soapOperation: 'GetPackages',
      restEndpoint: 'GET /shipment',
      fields: [
        {
          soapField: 'Filter.PackNumbers[]',
          restField: 'ShipmentNumbers[]',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Čísla zásilek'
        },
        {
          soapField: 'Filter.CustRefs[]',
          restField: 'CustomerReferences[]',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Reference zákazníka'
        },
        {
          soapField: 'Filter.DateFrom',
          restField: 'DateFrom',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Počáteční datum rozsahu'
        },
        {
          soapField: 'Filter.DateTo',
          restField: 'DateTo',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Koncové datum rozsahu'
        },
        {
          soapField: 'Filter.PackageStates',
          restField: 'ShipmentStates',
          soapType: 'enum',
          restType: 'enum',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Stavy zásilek'
        },
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky'
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
          notes: 'Typ produktu'
        },
        {
          soapField: 'PaymentInfo.CodPrice',
          restField: 'paymentInfo.codPrice',
          soapType: 'decimal',
          restType: 'double',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Částka dobírky'
        },
        {
          soapField: 'PaymentInfo.CodPaidDate',
          restField: 'paymentInfo.codPaidDate',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Datum zaplacení dobírky'
        },
        {
          soapField: 'PackageStatuses[].StatusDate',
          restField: 'trackAndTrace.events[].eventDate',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Datum události'
        },
        {
          soapField: 'PackageStatuses[].StatusName',
          restField: 'trackAndTrace.events[].name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Popis události'
        }
      ]
    },
'accesspoint-get': {
      title: 'Výdejní místa',
      description: 'Porovnání struktur pro získání informací o výdejních místech',
      soapOperation: 'GetParcelShops',
      restEndpoint: 'GET /accessPoint',
      fields: [
        {
          soapField: 'Filter.Code',
          restField: 'AccessPointCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód výdejního místa'
        },
        {
          soapField: 'Filter.CountryCode',
          restField: 'CountryCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód země'
        },
        {
          soapField: 'Filter.ZipCode',
          restField: 'ZipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'PSČ'
        },
        {
          soapField: 'Filter.City',
          restField: 'City',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Město'
        },
        {
          soapField: 'Filter.Radius',
          restField: 'Radius',
          soapType: 'int',
          restType: 'int',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Rádius vyhledávání (km)'
        },
        {
          soapField: 'Filter.ActiveCardPayment',
          restField: 'ActiveCardPayment',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Možnost platby kartou'
        },
        {
          soapField: 'Filter.ActiveCashPayment',
          restField: 'ActiveCashPayment',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Možnost platby v hotovosti'
        },
        {
          soapField: 'ParcelShopCode',
          restField: 'accessPointCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód výdejního místa'
        },
        {
          soapField: 'Name',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název výdejního místa'
        },
        {
          soapField: 'Street',
          restField: 'street',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Ulice'
        },
        {
          soapField: 'City',
          restField: 'city',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Město'
        },
        {
          soapField: 'ZipCode',
          restField: 'zipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'PSČ'
        },
        {
          soapField: 'Country',
          restField: 'country',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód země'
        },
        {
          soapField: 'Phone',
          restField: 'phone',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Telefonní číslo'
        },
        {
          soapField: 'ActiveCardPayment',
          restField: 'activeCardPayment',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Možnost platby kartou'
        },
        {
          soapField: 'ActiveCashPayment',
          restField: 'activeCashPayment',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Možnost platby v hotovosti'
        },
        {
          soapField: 'PickupEnabled',
          restField: 'pickupEnabled',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Možnost podání zásilky'
        }
      ]
    },
    'order-create': {
      title: 'Vytvoření objednávky',
      description: 'Porovnání struktur pro vytvoření objednávky přepravy',
      soapOperation: 'CreateOrders',
      restEndpoint: 'POST /order/batch',
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
          notes: 'Reference objednávky'
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
          notes: 'Typ produktu'
        },
        {
          soapField: 'CustRef',
          restField: 'customerReference',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '40',
          notes: 'Reference zákazníka'
        },
        {
          soapField: 'CountPack',
          restField: 'shipmentCount',
          soapType: 'int',
          restType: 'int',
          soapRequired: true,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Počet balíků'
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
          notes: 'Poznámka k objednávce'
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
          notes: 'Notifikační email'
        },
        {
          soapField: 'SendDate',
          restField: 'sendDate',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Datum odeslání'
        },
        {
          soapField: 'SendTimeFrom',
          restField: 'sendTimeFrom',
          soapType: 'dateTime',
          restType: 'dateSpan',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Čas odeslání od'
        },
        {
          soapField: 'SendTimeTo',
          restField: 'sendTimeTo',
          soapType: 'dateTime',
          restType: 'dateSpan',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Čas odeslání do'
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
          notes: 'Jméno odesílatele'
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
          notes: 'Ulice odesílatele'
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
          notes: 'Město odesílatele'
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
          notes: 'PSČ odesílatele'
        },
        {
          soapField: 'Sender.Country',
          restField: 'sender.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2+',
          notes: 'Kód země odesílatele'
        },
        {
          soapField: 'Recipient.Name',
          restField: 'recipient.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno příjemce'
        },
        {
          soapField: 'Recipient.Street',
          restField: 'recipient.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice příjemce'
        },
        {
          soapField: 'Recipient.City',
          restField: 'recipient.city',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Město příjemce'
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
          notes: 'PSČ příjemce'
        },
        {
          soapField: 'Recipient.Country',
          restField: 'recipient.country',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2+',
          notes: 'Kód země příjemce'
        }
      ]
    },
'codelist-currency': {
      title: 'Číselník měn',
      description: 'Porovnání struktur pro získání seznamu povolených měn',
      soapOperation: 'GetCodCurrency',
      restEndpoint: 'GET /codelist/currency',
      fields: [
        {
          soapField: 'CurrencyCode',
          restField: 'code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '3',
          notes: 'Kód měny'
        },
        {
          soapField: 'CurrencyName',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název měny'
        }
      ]
    },
    'codelist-product': {
      title: 'Číselník produktů',
      description: 'Porovnání struktur pro získání seznamu produktů',
      soapOperation: 'GetPackProducts',
      restEndpoint: 'GET /codelist/product',
      fields: [
        {
          soapField: 'ProductCode',
          restField: 'code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '4',
          notes: 'Kód produktu'
        },
        {
          soapField: 'ProductName',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název produktu'
        },
        {
          soapField: 'ProductDesc',
          restField: 'description',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Popis produktu'
        }
      ]
    },
    'codelist-country': {
      title: 'Číselník zemí',
      description: 'Porovnání struktur pro získání seznamu zemí',
      soapOperation: 'GetProductCountry',
      restEndpoint: 'GET /codelist/country',
      fields: [
        {
          soapField: 'CountryCode',
          restField: 'code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Kód země'
        },
        {
          soapField: 'CountryName',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název země'
        },
        {
          soapField: 'IsCODAllowed',
          restField: 'isCodAllowed',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Povolení dobírky'
        }
      ]
    },
    'order-get': {
  title: 'Sledování objednávek',
  description: 'Porovnání struktur pro získání informací o objednávkách',
  soapOperation: 'GetOrders',
  restEndpoint: 'GET /order',
  fields: [
    {
      soapField: 'Filter.OrderNumbers[]',
      restField: 'OrderNumbers[]',
      soapType: 'string[]',
      restType: 'string[]',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Max 50 položek',
      restLength: 'Max 50 položek',
      notes: 'Čísla objednávek'
    },
    {
      soapField: 'Filter.CustRefs[]',
      restField: 'CustomerReferences[]',
      soapType: 'string[]',
      restType: 'string[]',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Max 50 položek',
      restLength: 'Max 50 položek',
      notes: 'Reference zákazníka'
    },
    {
      soapField: 'Filter.DateFrom',
      restField: 'DateFrom',
      soapType: 'dateTime',
      restType: 'dateTime',
      soapRequired: false,
      restRequired: false,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Počáteční datum rozsahu'
    },
    {
      soapField: 'Filter.DateTo',
      restField: 'DateTo',
      soapType: 'dateTime',
      restType: 'dateTime',
      soapRequired: false,
      restRequired: false,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Koncové datum rozsahu'
    },
    {
      soapField: 'Filter.OrderStates',
      restField: 'OrderStates',
      soapType: 'enum',
      restType: 'enum',
      soapRequired: false,
      restRequired: false,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Stavy objednávek'
    },
    {
      soapField: 'OrderNumber',
      restField: 'orderNumber',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Číslo objednávky'
    },
    {
      soapField: 'CustRef',
      restField: 'customerReference',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: '40',
      notes: 'Reference zákazníka'
    },
    {
      soapField: 'OrderType',
      restField: 'orderType',
      soapType: 'string',
      restType: 'enum',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'enum',
      notes: 'Typ objednávky'
    },
    {
      soapField: 'CountPack',
      restField: 'shipmentCount',
      soapType: 'int',
      restType: 'int',
      soapRequired: true,
      restRequired: true,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Počet balíků'
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
      notes: 'Poznámka k objednávce'
    },
    {
      soapField: 'CreateDate',
      restField: 'createdDate',
      soapType: 'dateTime',
      restType: 'dateTime',
      soapRequired: true,
      restRequired: true,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Datum vytvoření objednávky'
    },
    {
      soapField: 'OrderState',
      restField: 'orderState',
      soapType: 'string',
      restType: 'enum',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'enum',
      notes: 'Stav objednávky'
    },
    {
      soapField: 'SendDate',
      restField: 'sendDate',
      soapType: 'dateTime',
      restType: 'dateTime',
      soapRequired: true,
      restRequired: true,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Datum odeslání'
    },
    {
      soapField: 'SendTimeFrom',
      restField: 'sendTimeFrom',
      soapType: 'dateTime',
      restType: 'dateSpan',
      soapRequired: false,
      restRequired: false,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Čas odeslání od'
    },
    {
      soapField: 'SendTimeTo',
      restField: 'sendTimeTo',
      soapType: 'dateTime',
      restType: 'dateSpan',
      soapRequired: false,
      restRequired: false,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Čas odeslání do'
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
      notes: 'Jméno odesílatele'
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
      notes: 'Ulice odesílatele'
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
      notes: 'Město odesílatele'
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
      notes: 'PSČ odesílatele'
    },
    {
      soapField: 'Sender.Country',
      restField: 'sender.country',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '2+',
      notes: 'Kód země odesílatele'
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
      notes: 'Jméno příjemce'
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
      notes: 'Ulice příjemce'
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
      notes: 'Město příjemce'
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
      notes: 'PSČ příjemce'
    },
    {
      soapField: 'Recipient.Country',
      restField: 'recipient.country',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '2+',
      notes: 'Kód země příjemce'
    },
    {
      soapField: 'OrderPackages[].PackNumber',
      restField: 'shipments[].shipmentNumber',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Číslo zásilky'
    },
    {
      soapField: 'OrderPackages[].PackState',
      restField: 'shipments[].shipmentState',
      soapType: 'string',
      restType: 'enum',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: 'enum',
      notes: 'Stav zásilky'
    }
  ]
},
'shipment-cancel': {
  title: 'Zrušení zásilky',
  description: 'Porovnání struktur pro zrušení zásilky',
  soapOperation: 'CancelPackage',
  restEndpoint: 'POST /shipment/{shipmentNumber}/cancel',
  fields: [
    {
      soapField: 'PackNumber',
      restField: 'shipmentNumber (v URL)',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Číslo zásilky (v REST API je součástí URL)'
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
      notes: 'Poznámka ke zrušení zásilky'
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
      notes: 'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)'
    },
    {
      soapField: 'ResultMessage',
      restField: 'message',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Popis výsledku operace'
    }
  ]
},
 
'shipment-redirect': {
  title: 'Přesměrování zásilky',
  description: 'Porovnání struktur pro aktualizaci/přesměrování zásilky',
  soapOperation: 'UpdatePackage',
  restEndpoint: 'POST /shipment/{shipmentNumber}/redirect',
  fields: [
    {
      soapField: 'PackNumber',
      restField: 'shipmentNumber (v URL)',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Číslo zásilky (v REST API je součástí URL)'
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
      notes: 'Poznámka k přesměrování'
    },
    {
      soapField: 'NewRecipient.Name',
      restField: 'recipient.name',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '50',
      notes: 'Jméno nového příjemce'
    },
    {
      soapField: 'NewRecipient.Name2',
      restField: 'recipient.name2',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: '50',
      notes: 'Doplňující jméno nového příjemce'
    },
    {
      soapField: 'NewRecipient.Street',
      restField: 'recipient.street',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '60',
      notes: 'Ulice nového příjemce'
    },
    {
      soapField: 'NewRecipient.City',
      restField: 'recipient.city',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '50',
      notes: 'Město nového příjemce'
    },
    {
      soapField: 'NewRecipient.ZipCode',
      restField: 'recipient.zipCode',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '10',
      notes: 'PSČ nového příjemce'
    },
    {
      soapField: 'NewRecipient.Country',
      restField: 'recipient.country',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '2+',
      notes: 'Kód země nového příjemce'
    },
    {
      soapField: 'NewRecipient.Contact',
      restField: 'recipient.contact',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: '50',
      notes: 'Kontaktní osoba nového příjemce'
    },
    {
      soapField: 'NewRecipient.Phone',
      restField: 'recipient.phone',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: '30',
      notes: 'Telefon nového příjemce'
    },
    {
      soapField: 'NewRecipient.Email',
      restField: 'recipient.email',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: '50',
      notes: 'Email nového příjemce'
    },
    {
      soapField: 'SpecDelivery.ParcelShopCode',
      restField: 'specificDelivery.parcelShopCode',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: '50',
      notes: 'Kód výdejního místa pro přesměrování'
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
      notes: 'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)'
    },
    {
      soapField: 'ResultMessage',
      restField: 'message',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Popis výsledku operace'
    }
  ]
},
'order-cancel': {
  title: 'Zrušení objednávky',
  description: 'Porovnání struktur pro zrušení objednávky',
  soapOperation: 'CancelOrder',
  restEndpoint: 'POST /order/cancel',
  fields: [
    {
      soapField: 'OrderNumber',
      restField: 'orderNumber',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Číslo objednávky'
    },
    {
      soapField: 'CustRef',
      restField: 'customerReference',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: '40',
      notes: 'Reference zákazníka'
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
      notes: 'Poznámka ke zrušení objednávky'
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
      notes: 'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)'
    },
    {
      soapField: 'ResultMessage',
      restField: 'message',
      soapType: 'string',
      restType: 'string',
      soapRequired: false,
      restRequired: false,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Popis výsledku operace'
    },
    {
      soapField: 'OrderStatus',
      restField: 'orderState',
      soapType: 'string',
      restType: 'enum',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'enum',
      notes: 'Stav objednávky po zrušení'
    }
  ]
},
'auth-login': {
  title: 'Autentizace',
  description: 'Porovnání struktur pro autentizaci',
  soapOperation: 'Login',
  restEndpoint: 'OAuth2/JWT autentizace',
  fields: [
    {
      soapField: 'Username',
      restField: 'client_id',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Uživatelské jméno / ID klienta'
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
      notes: 'Heslo / Tajný klíč klienta'
    },
    {
      soapField: 'N/A',
      restField: 'grant_type',
      soapType: 'N/A',
      restType: 'string',
      soapRequired: false,
      restRequired: true,
      soapLength: 'N/A',
      restLength: 'Enum',
      notes: 'Typ přihlášení (např. "client_credentials")'
    },
    {
      soapField: 'LoginTicket',
      restField: 'access_token',
      soapType: 'string',
      restType: 'string',
      soapRequired: true,
      restRequired: true,
      soapLength: 'Neomezeno',
      restLength: 'Neomezeno',
      notes: 'Autentizační token pro další požadavky'
    },
    {
      soapField: 'N/A',
      restField: 'token_type',
      soapType: 'N/A',
      restType: 'string',
      soapRequired: false,
      restRequired: true,
      soapLength: 'N/A',
      restLength: 'Enum',
      notes: 'Typ tokenu (např. "Bearer")'
    },
    {
      soapField: 'TicketExpiration',
      restField: 'expires_in',
      soapType: 'dateTime',
      restType: 'integer',
      soapRequired: false,
      restRequired: true,
      soapLength: 'N/A',
      restLength: 'N/A',
      notes: 'Doba platnosti tokenu v sekundách'
    }
  ]
}
  },
  
  // Obecné rozdíly mezi API
  generalDifferences: [
    {
      category: 'Autentizace',
      soapApproach: 'Vlastní autentizační model s přihlašovacími údaji v Auth elementu:',
      soapExample: '<Auth>\n  <UserName>username</UserName>\n  <Password>password</Password>\n  <!-- Nebo -->\n  <AuthToken>token</AuthToken>\n</Auth>',
      restApproach: 'Standardní OAuth2 nebo JWT autentizace:',
      restExample: 'Authorization: Bearer {token}',
      importance: 'high'
    },
    {
      category: 'Konvence pojmenování',
      soapApproach: 'PascalCase konvence pro názvy polí',
      soapExample: 'PackNumber, PackProductType, RecipientName',
      restApproach: 'camelCase konvence pro názvy polí',
      restExample: 'shipmentNumber, productType, recipientName',
      importance: 'medium'
    },
    {
      category: 'Formát požadavků a odpovědí',
      soapApproach: 'XML struktura s SOAP obálkou',
      soapExample: '<soapenv:Envelope xmlns:soapenv="...">\n  <soapenv:Header/>\n  <soapenv:Body>\n    <tns:CreatePackages>\n      <!-- obsah -->\n    </tns:CreatePackages>\n  </soapenv:Body>\n</soapenv:Envelope>',
      restApproach: 'JSON struktura',
      restExample: '{\n  "shipments": [\n    {\n      "referenceId": "id123",\n      "productType": "BUSS",\n      /* další pole */\n    }\n  ]\n}',
      importance: 'high'
    },
    {
      category: 'Komunikační model',
      soapApproach: 'RPC model s operacemi',
      soapExample: 'CreatePackages, GetPackages, LoginUser',
      restApproach: 'Resourceový model s HTTP metodami',
      restExample: 'POST /shipment/batch, GET /shipment, GET /accessPoint',
      importance: 'high'
    },
    {
      category: 'Zpracování chyb',
      soapApproach: 'SOAP Fault struktury s vlastními chybovými kódy',
      soapExample: '<soapenv:Fault>\n  <faultcode>soap:Server</faultcode>\n  <faultstring>Validační chyba</faultstring>\n  <detail>\n    <ValidationFault>...</ValidationFault>\n  </detail>\n</soapenv:Fault>',
      restApproach: 'HTTP stavové kódy s JSON chybovými objekty',
      restExample: '{\n  "type": "error-type",\n  "title": "Validační chyba",\n  "status": 400,\n  "detail": "Detailní popis chyby",\n  "errors": {\n    "field1": ["Chybová zpráva 1"],\n    "field2": ["Chybová zpráva 2"]\n  }\n}',
      importance: 'high'
    },
    {
      category: 'Limity délky polí',
      soapApproach: 'Většinou bez explicitního omezení délky polí',
      soapExample: 'Pole jako PackNumber, Note, Street nemají pevně stanovenou maximální délku',
      restApproach: 'Explicitní definice maximálních délek pro většinu polí',
      restExample: 'shipmentNumber: neomezeno, note: max 300, street: max 60, zipCode: max 10',
      importance: 'high'
    },
    {
      category: 'Stránkování',
      soapApproach: 'Stránkování pomocí komplexních filtrů',
      soapExample: 'Filter struktura s různými parametry',
      restApproach: 'Standardní stránkování pomocí Limit a Offset',
      restExample: '?Limit=100&Offset=0 s hlavičkami X-Paging-*',
      importance: 'medium'
    },
    {
      category: 'Dokumentace',
      soapApproach: 'WSDL soubor s XML schématem',
      soapExample: '<wsdl:definitions xmlns:wsdl="...">...</wsdl:definitions>',
      restApproach: 'OpenAPI (Swagger) specifikace',
      restExample: '{\n  "openapi": "3.0.1",\n  "info": {\n    "title": "CPL API",\n    "version": "v1"\n  },\n  "paths": { ... }\n}',
      importance: 'medium'
    },
    {
      category: 'Číselníky',
      soapApproach: 'Omezený počet samostatných operací pro číselníky',
      soapExample: 'GetCodCurrency, GetPackProducts, GetProductCountry',
      restApproach: 'Jednotný přístup ke všem číselníkům přes /codelist/* endpoint',
      restExample: 'GET /codelist/currency, GET /codelist/product, GET /codelist/country',
      importance: 'high'
    }
  ]
};
// Hlavní komponent pro porovnání API
function ApiComparison() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFieldMapping, setSelectedFieldMapping] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('endpoints'); // endpoints, fields, differences, codelist
  const [expandedDifferences, setExpandedDifferences] = useState<number[]>([]);

  // Filtrování endpointů podle kategorie a vyhledávání
  const filteredEndpoints = apiData.endpointMappings.filter(endpoint => {
    const matchesCategory = selectedCategory ? endpoint.category === selectedCategory : true;
    const matchesSearch = searchTerm.trim() === '' ? true : 
      (endpoint.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch && endpoint.category !== 'codelist';
  });
  
  // Filtrování pouze endpointů z kategorie codelist pro záložku Číselníků
  const codelistEndpoints = apiData.endpointMappings.filter(endpoint => {
    return endpoint.category === 'codelist' && (searchTerm.trim() === '' ? true : 
      (endpoint.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase())));
  });
  
  // Filtrování polí podle vyhledávání
  const getFilteredFields = (mappingId: string) => {
    if (!mappingId || !(mappingId in apiData.fieldMappings)) return [];
    
    const fields = apiData.fieldMappings[mappingId as keyof typeof apiData.fieldMappings].fields;
    if (searchTerm.trim() === '') return fields;
    
    return fields.filter(field => 
      field.soapField.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.restField.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Funkce pro zvýraznění rozdílů v požadavcích
  const highlightDifferences = (field: Field) => {
    const hasTypeDiff = field.soapType !== field.restType;
    const hasRequiredDiff = field.soapRequired !== field.restRequired;
    const hasLengthDiff = field.soapLength !== field.restLength;
    
    return {
      hasAnyDiff: hasTypeDiff || hasRequiredDiff || hasLengthDiff,
      hasTypeDiff,
      hasRequiredDiff,
      hasLengthDiff
    };
  };
  
  // Funkce pro přepínání rozbalení rozdílu
  const toggleDifference = (index: number) => {
    if (expandedDifferences.includes(index)) {
      setExpandedDifferences(expandedDifferences.filter(item => item !== index));
    } else {
      setExpandedDifferences([...expandedDifferences, index]);
    }
  };

return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Porovnání myAPI (SOAP) vs CPL API (REST)</h1>
      
      {/* Navigační lišta */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'endpoints' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('endpoints')}
        >
          Mapování endpointů
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'fields' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('fields')}
        >
          Porovnání polí
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'codelist' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('codelist')}
        >
          Číselníky
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'differences' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('differences')}
        >
          Obecné rozdíly
        </button>
      </div>
      
      {/* Vyhledávací panel */}
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Vyhledat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* {(activeTab === 'endpoints' || activeTab === 'fields') && (
          <div className="flex-grow max-w-xs">
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Všechny kategorie</option>
              {apiData.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )} */}
        
        {/* {activeTab === 'fields' && (
          <div className="flex-grow max-w-xs">
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedFieldMapping || ''}
              onChange={(e) => setSelectedFieldMapping(e.target.value || null)}
            >
              <option value="">Vyberte operaci pro porovnání polí</option>
              {Object.keys(apiData.fieldMappings).map(key => (
                <option key={key} value={key}>
                  {apiData.fieldMappings[key as keyof typeof apiData.fieldMappings].title}
                </option>
              ))}
            </select>
          </div>
        )} */}
      </div>

{/* Obsah záložky Mapování endpointů */}
{activeTab === 'endpoints' && (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 table-fixed">
      <thead className="bg-[#f5f5f5]">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            myAPI (SOAP)
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            CPL API (REST)
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            Popis
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/6">
            Klíčové rozdíly
          </th>
        </tr>
      </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Nebyly nalezeny žádné odpovídající endpointy
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((endpoint, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // Automaticky nastaví vybranou kategorii pro záložku Porovnání polí
                      const mappingId = Object.keys(apiData.fieldMappings).find(key => {
                        const mapping = apiData.fieldMappings[key as keyof typeof apiData.fieldMappings];
                        return mapping.soapOperation === endpoint.soapOperation || 
                               mapping.restEndpoint === endpoint.restEndpoint;
                      });
                      
                      if (mappingId) {
                        setSelectedFieldMapping(mappingId);
                        setActiveTab('fields');
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="font-semibold">{endpoint.soapOperation}</div>
                      <div className="text-xs text-gray-500">{endpoint.soapDescription}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <div className="font-semibold">{endpoint.restEndpoint}</div>
                      <div className="text-xs text-gray-500">{endpoint.restDescription}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {apiData.categories.find(c => c.id === endpoint.category)?.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 break-words" 
                      title={endpoint.mainDifferences}>
                      {endpoint.mainDifferences}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Obsah záložky Číselníky */}
      {activeTab === 'codelist' && (
        <div className="overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Číselníky a referenční data</h2>
          <p className="mb-6 text-gray-600">Porovnání dostupných číselníků a referenčních dat mezi myAPI (SOAP) a CPL API (REST)</p>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  myAPI (SOAP)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPL API (REST)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Popis
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poznámka
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codelistEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Nebyly nalezeny žádné odpovídající číselníky
                  </td>
                </tr>
              ) : (
                codelistEndpoints.map((endpoint, index) => (
                  <tr 
                    key={index} 
                    className={endpoint.soapOperation === 'N/A' ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                    onClick={() => {
                      // Automaticky nastaví vybranou kategorii pro záložku Porovnání polí
                      const mappingId = Object.keys(apiData.fieldMappings).find(key => {
                        const mapping = apiData.fieldMappings[key as keyof typeof apiData.fieldMappings];
                        return mapping.soapOperation === endpoint.soapOperation || 
                              mapping.restEndpoint === endpoint.restEndpoint;
                      });
                      
                      if (mappingId) {
                        setSelectedFieldMapping(mappingId);
                        setActiveTab('fields');
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {endpoint.soapOperation === 'N/A' ? (
                        <span className="text-gray-400 italic">Nepodporováno</span>
                      ) : (
                        <div>
                          <div className="font-semibold">{endpoint.soapOperation}</div>
                          <div className="text-xs text-gray-500">{endpoint.soapDescription}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <div className="font-semibold">{endpoint.restEndpoint}</div>
                      <div className="text-xs text-gray-500">{endpoint.restDescription}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {apiData.categories.find(c => c.id === endpoint.category)?.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {endpoint.mainDifferences}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
{/* Obsah záložky Porovnání polí */}
      {activeTab === 'fields' && (
        <div>
          {!selectedFieldMapping ? (
            <div className="text-center py-8 text-gray-500">
              <p>Vyberte operaci pro zobrazení porovnání polí</p>
            </div>
          ) : (
            (() => {
              const mapping = apiData.fieldMappings[selectedFieldMapping as keyof typeof apiData.fieldMappings];

              return (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{mapping.title}</h2>
                    <p className="text-gray-600">{mapping.description}</p>
                    <div className="mt-2 flex gap-8">
                      <div>
                        <span className="text-sm font-semibold text-gray-600">SOAP:</span>
                        <span className="text-sm ml-2 text-gray-800">{mapping.soapOperation}</span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-600">REST:</span>
                        <span className="text-sm ml-2 text-blue-600">{mapping.restEndpoint}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">myAPI pole</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPL API pole</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datový typ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Povinné</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max. délka</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popis</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredFields(selectedFieldMapping).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                              Nebyly nalezeny žádné odpovídající pole
                            </td>
                          </tr>
                        ) : (
                          getFilteredFields(selectedFieldMapping).map((field, index) => {
                            const diff = highlightDifferences(field);
                            return (
                              <tr key={index} className={diff.hasAnyDiff ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.soapField}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{field.restField}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${diff.hasTypeDiff ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                  {field.soapType} → {field.restType}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${diff.hasRequiredDiff ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                  {field.soapRequired ? 'Ano' : 'Ne'} → {field.restRequired ? 'Ano' : 'Ne'}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${diff.hasLengthDiff ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                  {field.soapLength} → {field.restLength}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{field.notes}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}

      {/* Obsah záložky Obecné rozdíly */}
      {activeTab === 'differences' && (
        <div className="space-y-6">
          {apiData.generalDifferences
            .filter(diff => searchTerm.trim() === '' || 
              diff.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
              diff.soapApproach.toLowerCase().includes(searchTerm.toLowerCase()) ||
              diff.restApproach.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((diff, index) => (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden ${diff.importance === 'high' ? 
                  'border-orange-300 bg-orange-50' : diff.importance === 'medium' ? 
                  'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
              >
                <div 
                  className="px-4 py-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleDifference(index)}
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {diff.importance === 'high' && (
                      <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-orange-500 rounded-full">Důležité</span>
                    )}
                    {diff.category}
                  </h3>
                  <button className="text-gray-500 focus:outline-none">
                    {expandedDifferences.includes(index) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {expandedDifferences.includes(index) && (
                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">myAPI (SOAP)</h4>
                        <p className="text-sm text-gray-600 mb-3">{diff.soapApproach}</p>
                        <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">{diff.soapExample}</pre>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">CPL API (REST)</h4>
                        <p className="text-sm text-gray-600 mb-3">{diff.restApproach}</p>
                        <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">{diff.restExample}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
          {/* Sekce doporučení pro migraci */}
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Doporučení pro migraci</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">1. Změny v autentizaci</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Implementujte OAuth2/JWT autentizaci místo přihlašovacích údajů</li>
                  <li>Vytvořte nové autentizační komponenty pro zpracování Bearer tokenů</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">2. Zpracování požadavků a odpovědí</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Aktualizujte všechny názvy polí dle camelCase konvence</li>
                  <li>Zkontrolujte povinná pole v nové API</li>
                  <li>Aktualizujte validace délky polí podle nových omezení</li>
                  <li>Implementujte zpracování HTTP stavových kódů místo SOAP chyb</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">3. Mapování endpointů</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Přepracujte kód pro použití nových REST endpointů</li>
                  <li>Aktualizujte konstrukci URL pro strukturu REST API</li>
                  <li>Implementujte správné HTTP metody (GET, POST, PUT) místo SOAP operací</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">4. Datové typy</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Změňte XML serializaci/deserializaci na JSON</li>
                  <li>Aktualizujte zpracování data/času pro formát REST API</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">5. Stránkování a filtrování</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Implementujte stránkování REST stylem pomocí parametrů limit/offset</li>
                  <li>Aktualizujte parametry filtrů na formát query parametrů</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">6. Postup testování</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Testujte paralelní implementace před úplným přechodem</li>
                  <li>Ověřte mapování polí a jejich omezení</li>
                  <li>Testujte zpracování chyb za různých podmínek</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
{/* Vysvětlivky pro porovnání polí */}
      {activeTab === 'fields' && selectedFieldMapping && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Vysvětlivky:</span>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-50 border border-yellow-200 rounded-full mr-2"></span>
              <span>Žluté řádky označují pole s rozdíly mezi API</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block text-red-600 font-semibold mr-2">Červený text</span>
              <span>Označuje konkrétní rozdíly v parametrech</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block mr-2">→</span>
              <span>Šipka symbolizuje změnu z myAPI na CPL API</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiComparison;
