const { PDFDocument } = require('pdf-lib');
const { generatePdf, closeBrowser } = require('../../src/pdf-generator');

jest.setTimeout(60000);

function buildContractData(overrides = {}) {
  return {
    owner: {
      id: 1,
      name: '王小明',
      nationalId: 'A123456789',
      phone: '0912345678',
      address: '台北市信義區松高路1號',
      emergencyContactName: '王大明',
      emergencyContactPhone: '0922333444',
      emergencyContactRelationship: '父子',
    },
    pet: {
      id: 10,
      name: '小白',
      species: '犬',
      breed: '柴犬',
      gender: '公',
      age: '3歲',
      isNeutered: true,
      chipNumber: '900000000012345',
      personality: ['親人'],
      physicalExamination: {
        eyes: '正常', ears: '正常', teeth: '正常',
        limbs: '正常', skin: '正常', fur: '正常',
      },
      medicalHistory: [],
    },
    record: {
      id: 100,
      appointmentId: 1,
      serviceDate: '2026-04-16',
      serviceTime: '10:00',
      services: [{ item: '洗澡', price: 500 }],
      totalCost: 500,
      storedValueDeduction: 500,
      cashPayment: 0,
    },
    appointment: {
      id: 1,
      date: '2026-04-16',
      time: '10:00',
    },
    hospital: {
      name: '安欣動物醫院',
      phone: '03-3367775',
      address: '桃園市桃園區中福街60號',
    },
    rocDate: '115年04月16日',
    ...overrides,
  };
}

describe('pdf-generator', () => {
  afterAll(async () => {
    await closeBrowser();
  });

  test('generatePdf returns a Buffer with PDF signature', async () => {
    const buf = await generatePdf(buildContractData());
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('output has at least 4 pages', async () => {
    const buf = await generatePdf(buildContractData());
    const doc = await PDFDocument.load(buf);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(4);
  });

  test('output contains EOF marker', async () => {
    const buf = await generatePdf(buildContractData());
    expect(buf.toString('latin1')).toContain('%%EOF');
  });

  test('handles missing optional fields gracefully', async () => {
    const data = buildContractData({
      record: {
        id: 100,
        appointmentId: 1,
        serviceDate: '2026-04-16',
        serviceTime: '10:00',
        services: [],
        totalCost: 0,
        storedValueDeduction: 0,
        cashPayment: 0,
      },
      pet: {
        id: 10, name: '小白', species: '犬', breed: '柴犬', gender: '公',
      },
    });
    const buf = await generatePdf(data);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
