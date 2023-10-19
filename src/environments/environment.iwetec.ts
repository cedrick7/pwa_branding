import { overrides } from './environment.development';
import { ENVIRONMENT_DEFAULTS, Environment } from './environment.model';

export const environment: Environment = {
  ...ENVIRONMENT_DEFAULTS,

  icmChannel: 'IWETEC-IWETEC_DE-Site',

  themeColor: '#688dc3',

  features: [
    ...ENVIRONMENT_DEFAULTS.features,
    'businessCustomerRegistration',
    'costCenters',
    'maps',
    'messageToMerchant',
    'punchout',
    // 'quickorder',
    'quoting',
    'orderTemplates',
  ],

  smallBreakpointWidth: 768,
  mediumBreakpointWidth: 992,
  largeBreakpointWidth: 1200,
  extralargeBreakpointWidth: 1400,

  ...overrides,
};
