// Deterministic contract data used by both baseline generation and visual
// regression tests.  Changing any field here will cause the baseline PNGs to
// drift, so treat this file as part of the snapshot contract.
module.exports = {
  owner: {
    id: 'owner_001',
    name: '王大明',
    nationalId: 'A123456789',
    phone: '0912345678',
    address: '桃園市桃園區中正路1號',
    emergencyContactName: '王太太',
    emergencyContactPhone: '0987654321',
    emergencyContactRelationship: '配偶',
    isStoredValueCustomer: true,
    storedValueBalance: 5000,
    preferredAnimalHospital: '',
    preferredAnimalHospitalPhone: '',
    preferredAnimalHospitalAddress: '',
  },
  pet: {
    id: 'pet_001',
    name: '老黃',
    species: '犬',
    breed: '柴犬',
    gender: '公',
    age: '3歲',
    isNeutered: true,
    chipNumber: '900000000012345',
    unregisteredIdMethod: '',
    personality: ['親人', '不會咬人'],
    physicalExamination: {
      eyes: '正常', ears: '正常', teeth: '正常',
      limbs: '正常', skin: '正常', fur: '正常',
    },
    medicalHistory: ['心臟病'],
  },
  record: {
    id: 'rec_001',
    appointmentId: 'appt_001',
    serviceDate: '2026-04-18',
    serviceTime: '11:52',
    services: [
      { item: '洗澡', price: 500 },
      { item: '美容', price: 800 },
    ],
    totalCost: 1300,
    storedValueDeduction: 1300,
    cashPayment: 0,
  },
  appointment: { id: 'appt_001' },
  hospital: {
    name: '安欣動物醫院',
    phone: '03-3367775',
    address: '桃園市桃園區中福街60號',
  },
  rocDate: '中華民國 115 年 04 月 18 日',
};
