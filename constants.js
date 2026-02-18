// Vehicle Type Presets
const VEHICLE_PRESETS = {
  'Kuorma-auto': [
    // 2-axle
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
        { type: 'dual' }
      ]
    },

    // 3-axle
    {
      name: '6x2',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '6x2*4',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' }
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
        { type: 'dual' },
        { type: 'dual' }
      ]
    },

    // 4-axle
    {
      name: '8x2',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x2*4',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x4',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x6',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x8',
      axles: 4,
      data: [
        { type: 'single' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    }
  ],

  'Perävaunu': [
    {
      name: '4x0 (single/single)',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '4x0 (dual/dual)',
      axles: 2,
      data: [
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '6x0 (single/single/single)',
      axles: 3,
      data: [
        { type: 'single' },
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '6x0 (dual/dual/dual)',
      axles: 3,
      data: [
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    },
    {
      name: '8x0 (dual/dual/dual/dual)',
      axles: 4,
      data: [
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' },
        { type: 'dual' }
      ]
    }
  ],

  'Auto': [
    {
      name: '4x2 (single/single)',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'single' }
      ]
    },
    {
      name: '4x2 (single/dual)',
      axles: 2,
      data: [
        { type: 'single' },
        { type: 'dual' }
      ]
    }
  ]
};
