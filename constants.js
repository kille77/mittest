const VEHICLE_PRESETS = {
  'Auto': [
    {
      name: '4x2 (henkilöauto)',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '4x2 (pakettiauto dually)',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'dual' }
      ]
    }
  ],

  'Kuorma-auto': [
    {
      name: '4x2',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'dual' }
      ]
    },
    {
      name: '4x4',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '6x2',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'single' }
      ]
    },
    {
      name: '6x2*4',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'single' }
      ]
    },
    {
      name: '6x4',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '6x6',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '8x2',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'dual' },
        { type: 'single' }
      ]
    },
    {
      name: '8x2*6',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'dual' },
        { type: 'single' }
      ]
    },
    {
      name: '8x4',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x6',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x8',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '10x4',
      axles: 5,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'single' }
      ]
    },
    {
      name: '10x6',
      axles: 5,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    }
  ],

  'Perävaunu': [
    {
      name: '4x0 (single)',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '4x0 (dual)',
      axles: 2,
      data: [
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '6x0 (single)',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '6x0 (dual)',
      axles: 3,
      data: [
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x0 (single)',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '8x0 (dual)',
      axles: 4,
      data: [
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '10x0 (single)',
      axles: 5,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '10x0 (dual)',
      axles: 5,
      data: [
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '12x0 (single)',
      axles: 6,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '12x0 (dual)',
      axles: 6,
      data: [
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    }
  ]
};
