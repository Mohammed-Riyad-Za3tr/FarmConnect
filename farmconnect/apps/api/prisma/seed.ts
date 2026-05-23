/**
 * prisma/seed.ts — Database seed script.
 *
 * Run via:
 *   pnpm --filter @farmconnect/api db:seed
 *   prisma db seed  (from apps/api)
 *
 * Phase 2B: multilingual categories.
 * Phase 2C: admin/producer/buyer users, sample products, notifications,
 *           audit log, analytics snapshot, AI forecast, AI recommendation.
 */

import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting...');

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = [
    { slug: 'meats', nameEn: 'Meats', nameAr: 'لحوم' },
    { slug: 'vegetables', nameEn: 'Vegetables', nameAr: 'خضر' },
    { slug: 'fruits', nameEn: 'Fruits', nameAr: 'فواكه' },
    { slug: 'fresh', nameEn: 'Fresh', nameAr: 'طازجة' },
    { slug: 'dairy', nameEn: 'Dairy', nameAr: 'ألبان' },
    { slug: 'grains', nameEn: 'Grains', nameAr: 'حبوب' },
    { slug: 'herbs', nameEn: 'Herbs', nameAr: 'أعشاب' },
    { slug: 'honey', nameEn: 'Honey', nameAr: 'عسل' },
    { slug: 'eggs', nameEn: 'Eggs', nameAr: 'بيض' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameEn: cat.nameEn, nameAr: cat.nameAr, parentId: null },
      create: { slug: cat.slug, nameEn: cat.nameEn, nameAr: cat.nameAr, parentId: null },
    });
  }
  console.log(`[seed] Upserted ${categories.length} categories`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin1234', 10);
  const userHash = await bcrypt.hash('test1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@farmconnect.dz' },
    update: {
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=FarmConnect%20Admin',
    },
    create: {
      email: 'admin@farmconnect.dz',
      passwordHash: adminHash,
      fullName: 'FarmConnect Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=FarmConnect%20Admin',
    },
  });

  const producerUser = await prisma.user.upsert({
    where: { email: 'ahmed@farmconnect.dz' },
    update: {
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Ahmed%20Meziane',
    },
    create: {
      email: 'ahmed@farmconnect.dz',
      passwordHash: userHash,
      fullName: 'Ahmed Meziane',
      role: 'PRODUCER',
      status: 'ACTIVE',
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Ahmed%20Meziane',
    },
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: 'sara@farmconnect.dz' },
    update: {
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Sara%20Bouzid',
    },
    create: {
      email: 'sara@farmconnect.dz',
      passwordHash: userHash,
      fullName: 'Sara Bouzid',
      role: 'BUYER',
      status: 'ACTIVE',
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Sara%20Bouzid',
    },
  });

  console.log('[seed] Upserted 3 users (admin / producer / buyer)');

  // ── Profiles ───────────────────────────────────────────────────────────────
  const producerProfile = await prisma.producerProfile.upsert({
    where: { userId: producerUser.id },
    update: {
      businessName: 'Ferme Meziane',
      businessType: 'individual',
      bio: 'Family farm in Guelma producing vegetables, eggs, herbs, and olive oil.',
      wilaya: '24 - Guelma',
      commune: 'Guelma',
      latitude: 36.4621,
      longitude: 7.4261,
      producerOffersDelivery: true,
      verificationStatus: 'APPROVED',
    },
    create: {
      userId: producerUser.id,
      businessName: 'Ferme Meziane',
      businessType: 'individual',
      bio: 'Family farm in Guelma producing vegetables, eggs, herbs, and olive oil.',
      wilaya: '24 - Guelma',
      commune: 'Guelma',
      latitude: 36.4621,
      longitude: 7.4261,
      producerOffersDelivery: true,
      nif: '00312345678901',
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      verifiedById: admin.id,
    },
  });

  await prisma.buyerProfile.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: { userId: buyerUser.id },
  });

  console.log('[seed] Upserted 2 profiles (producer / buyer)');

  // Additional producers across multiple wilayas for geo/filter testing
  const extraProducers = [
    {
      email: 'karim@farmconnect.dz',
      fullName: 'Karim Benali',
      avatarSeed: 'Karim Benali',
      businessName: 'Ferme Mitidja Verte',
      wilaya: '09', // Blida
      commune: 'Boufarik',
      latitude: 36.5741,
      longitude: 2.9121,
    },
    {
      email: 'nour@farmconnect.dz',
      fullName: 'Nour Khelifi',
      avatarSeed: 'Nour Khelifi',
      businessName: 'Domaine des Hauts Plateaux',
      wilaya: '19', // Setif
      commune: 'Setif',
      latitude: 36.1902,
      longitude: 5.4137,
    },
    {
      email: 'yasmine@farmconnect.dz',
      fullName: 'Yasmine Ait Hamou',
      avatarSeed: 'Yasmine Ait Hamou',
      businessName: 'Ferme Numidia',
      wilaya: '25', // Constantine
      commune: 'El Khroub',
      latitude: 36.2743,
      longitude: 6.6924,
    },
    {
      email: 'bilal@farmconnect.dz',
      fullName: 'Bilal Mansouri',
      avatarSeed: 'Bilal Mansouri',
      businessName: 'Oasis Biskra Premium',
      wilaya: '07', // Biskra
      commune: 'Biskra',
      latitude: 34.8504,
      longitude: 5.7280,
    },
    {
      email: 'lina.pro@farmconnect.dz',
      fullName: 'Lina Haddad',
      avatarSeed: 'Lina Haddad',
      businessName: 'Ferme Sahel Bio',
      wilaya: '16', // Alger
      commune: 'Cheraga',
      latitude: 36.7595,
      longitude: 2.9994,
    },
    {
      email: 'rachid.pro@farmconnect.dz',
      fullName: 'Rachid Kaci',
      avatarSeed: 'Rachid Kaci',
      businessName: 'Domaine Kabyle',
      wilaya: '15', // Tizi Ouzou
      commune: 'Tizi Ouzou',
      latitude: 36.7116,
      longitude: 4.0458,
    },
    {
      email: 'amira.pro@farmconnect.dz',
      fullName: 'Amira Taleb',
      avatarSeed: 'Amira Taleb',
      businessName: 'Ferme Aurès',
      wilaya: '05', // Batna
      commune: 'Batna',
      latitude: 35.5559,
      longitude: 6.1739,
    },
    {
      email: 'tarek.pro@farmconnect.dz',
      fullName: 'Tarek Zerrouki',
      avatarSeed: 'Tarek Zerrouki',
      businessName: 'Oasis Adrar Vert',
      wilaya: '01', // Adrar
      commune: 'Adrar',
      latitude: 27.8743,
      longitude: -0.2939,
    },
    {
      email: 'nawal.pro@farmconnect.dz',
      fullName: 'Nawal Bensaid',
      avatarSeed: 'Nawal Bensaid',
      businessName: 'Domaine Tlemcen',
      wilaya: '13', // Tlemcen
      commune: 'Tlemcen',
      latitude: 34.8783,
      longitude: -1.3150,
    },
    {
      email: 'younes.pro@farmconnect.dz',
      fullName: 'Younes Amrane',
      avatarSeed: 'Younes Amrane',
      businessName: 'Ferme Hodna',
      wilaya: '28', // M’Sila
      commune: 'M’Sila',
      latitude: 35.7058,
      longitude: 4.5419,
    },
  ];

  const extraBuyers = [
    {
      email: 'salma@farmconnect.dz',
      fullName: 'Salma Aouadi',
      avatarSeed: 'Salma Aouadi',
    },
    {
      email: 'hakim@farmconnect.dz',
      fullName: 'Hakim Bouziane',
      avatarSeed: 'Hakim Bouziane',
    },
    {
      email: 'ines@farmconnect.dz',
      fullName: 'Ines Touati',
      avatarSeed: 'Ines Touati',
    },
    {
      email: 'walid@farmconnect.dz',
      fullName: 'Walid Cherif',
      avatarSeed: 'Walid Cherif',
    },
    {
      email: 'mouna@farmconnect.dz',
      fullName: 'Mouna Belkacem',
      avatarSeed: 'Mouna Belkacem',
    },
    {
      email: 'fethi@farmconnect.dz',
      fullName: 'Fethi Aissani',
      avatarSeed: 'Fethi Aissani',
    },
    {
      email: 'siham@farmconnect.dz',
      fullName: 'Siham Ouali',
      avatarSeed: 'Siham Ouali',
    },
    {
      email: 'nadir@farmconnect.dz',
      fullName: 'Nadir Kherchouche',
      avatarSeed: 'Nadir Kherchouche',
    },
    {
      email: 'dalila@farmconnect.dz',
      fullName: 'Dalila Ferhat',
      avatarSeed: 'Dalila Ferhat',
    },
    {
      email: 'sofiane@farmconnect.dz',
      fullName: 'Sofiane Boulahdjar',
      avatarSeed: 'Sofiane Boulahdjar',
    },
  ];

  const extraProducerProfiles: Array<{ id: string; businessName: string }> = [];
  for (const producer of extraProducers) {
    const user = await prisma.user.upsert({
      where: { email: producer.email },
      update: {
        fullName: producer.fullName,
        role: 'PRODUCER',
        status: 'ACTIVE',
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(producer.avatarSeed)}`,
      },
      create: {
        email: producer.email,
        passwordHash: userHash,
        fullName: producer.fullName,
        role: 'PRODUCER',
        status: 'ACTIVE',
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(producer.avatarSeed)}`,
      },
    });

    const profile = await prisma.producerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: producer.businessName,
        wilaya: producer.wilaya,
        commune: producer.commune,
        verificationStatus: 'APPROVED',
        latitude: producer.latitude,
        longitude: producer.longitude,
      },
      create: {
        userId: user.id,
        businessName: producer.businessName,
        businessType: 'individual',
        bio: `High-quality local products from ${producer.commune}.`,
        wilaya: producer.wilaya,
        commune: producer.commune,
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        verifiedById: admin.id,
        latitude: producer.latitude,
        longitude: producer.longitude,
      },
    });
    extraProducerProfiles.push({ id: profile.id, businessName: profile.businessName });
  }
  console.log(`[seed] Upserted ${extraProducerProfiles.length} additional producer profiles`);

  const selectedProducerProfiles = extraProducerProfiles.slice(0, 5);
  const selectedProducerIdSet = new Set(selectedProducerProfiles.map((profile) => profile.id));

  for (const buyer of extraBuyers) {
    const user = await prisma.user.upsert({
      where: { email: buyer.email },
      update: {
        fullName: buyer.fullName,
        role: 'BUYER',
        status: 'ACTIVE',
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(buyer.avatarSeed)}`,
      },
      create: {
        email: buyer.email,
        passwordHash: userHash,
        fullName: buyer.fullName,
        role: 'BUYER',
        status: 'ACTIVE',
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(buyer.avatarSeed)}`,
      },
    });

    await prisma.buyerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }
  console.log(`[seed] Upserted ${extraBuyers.length} additional buyers`);

  // ── Products ───────────────────────────────────────────────────────────────
  const vegetablesCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'vegetables' } });
  const freshCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'fresh' } });
  const fruitsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'fruits' } });
  const herbsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'herbs' } });
  const honeyCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'honey' } });
  const dairyCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'dairy' } });
  const meatsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'meats' } });
  const eggsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'eggs' } });

  const tomato = await prisma.product.upsert({
    where: { slug: 'fresh-tomatoes-meziane' },
    update: {},
    create: {
      producerId: producerProfile.id,
      categoryId: vegetablesCat.id,
      title: { en: 'Fresh Tomatoes', ar: 'طماطم طازجة' },
      description: {
        en: 'Organically grown tomatoes from Tipaza, harvested daily.',
        ar: 'طماطم مزروعة بشكل عضوي من تيپازة، يتم حصادها يومياً.',
      },
      slug: 'fresh-tomatoes-meziane',
      price: 120.0,
      unit: 'KG',
      stock: 500,
      status: 'ACTIVE',
      tags: ['organic', 'fresh', 'vegetables'],
    },
  });

  const oliveOil = await prisma.product.upsert({
    where: { slug: 'extra-virgin-olive-oil-meziane' },
    update: {},
    create: {
      producerId: producerProfile.id,
      categoryId: freshCat.id,
      title: { en: 'Extra Virgin Olive Oil', ar: 'زيت زيتون بكر ممتاز' },
      description: {
        en: 'Cold-pressed extra virgin olive oil from century-old trees.',
        ar: 'زيت زيتون بكر ممتاز معصور على البارد من أشجار معمرة.',
      },
      slug: 'extra-virgin-olive-oil-meziane',
      price: 850.0,
      unit: 'BOX',
      stock: 200,
      status: 'ACTIVE',
      tags: ['organic', 'cold-pressed', 'olive-oil'],
    },
  });

  const oranges = await prisma.product.upsert({
    where: { slug: 'citrus-oranges-meziane' },
    update: {},
    create: {
      producerId: producerProfile.id,
      categoryId: fruitsCat.id,
      title: { en: 'Citrus Oranges', ar: 'برتقال حمضي' },
      description: {
        en: 'Sweet and juicy oranges picked from coastal orchards.',
        ar: 'برتقال حلو وعصيري مقطوف من بساتين الساحل.',
      },
      slug: 'citrus-oranges-meziane',
      price: 260.0,
      unit: 'KG',
      stock: 320,
      status: 'ACTIVE',
      tags: ['fruits', 'citrus', 'fresh'],
    },
  });

  const mint = await prisma.product.upsert({
    where: { slug: 'fresh-mint-bundle-meziane' },
    update: {},
    create: {
      producerId: producerProfile.id,
      categoryId: herbsCat.id,
      title: { en: 'Fresh Mint Bundle', ar: 'حزمة نعناع طازج' },
      description: {
        en: 'Aromatic fresh mint bundles ideal for tea and salads.',
        ar: 'حزم نعناع عطرية طازجة مناسبة للشاي والسلطات.',
      },
      slug: 'fresh-mint-bundle-meziane',
      price: 140.0,
      unit: 'BOX',
      stock: 260,
      status: 'ACTIVE',
      tags: ['mint', 'herbs', 'aromatic'],
    },
  });

  const honey = await prisma.product.upsert({
    where: { slug: 'wildflower-honey-meziane' },
    update: {},
    create: {
      producerId: producerProfile.id,
      categoryId: honeyCat.id,
      title: { en: 'Wildflower Honey', ar: 'عسل الزهور البرية' },
      description: {
        en: 'Raw wildflower honey harvested in small seasonal batches.',
        ar: 'عسل زهور برية خام يُحصد على دفعات موسمية صغيرة.',
      },
      slug: 'wildflower-honey-meziane',
      price: 1250.0,
      unit: 'BOX',
      stock: 95,
      status: 'ACTIVE',
      tags: ['honey', 'raw', 'natural'],
    },
  });

  const eggs = await prisma.product.upsert({
    where: { slug: 'free-range-eggs-meziane' },
    update: {},
    create: {
      producerId: producerProfile.id,
      categoryId: dairyCat.id,
      title: { en: 'Free-Range Eggs', ar: 'بيض بلدي' },
      description: {
        en: 'Fresh free-range eggs collected daily from small farm lots.',
        ar: 'بيض بلدي طازج يُجمع يومياً من مزارع صغيرة.',
      },
      slug: 'free-range-eggs-meziane',
      price: 45.0,
      unit: 'PIECE',
      stock: 600,
      status: 'ACTIVE',
      tags: ['eggs', 'free-range', 'dairy'],
    },
  });

  const [blidaProducer, setifProducer, constantineProducer, biskraProducer] = extraProducerProfiles;
  const grainsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'grains' } });

  const extraProducts = [
    {
      producerId: blidaProducer.id,
      categoryId: vegetablesCat.id,
      slug: 'green-zucchini-mitidja',
      title: { en: 'Green Zucchini', ar: 'كوسة خضراء' },
      description: { en: 'Crisp zucchini from Mitidja plains.', ar: 'كوسة مقرمشة من سهول متيجة.' },
      price: 180.0,
      unit: 'KG' as const,
      stock: 410,
      tags: ['vegetables', 'fresh', 'mitidja'],
    },
    {
      producerId: setifProducer.id,
      categoryId: grainsCat.id,
      slug: 'durum-wheat-setif',
      title: { en: 'Durum Wheat', ar: 'قمح صلب' },
      description: { en: 'Premium durum wheat for couscous and semolina.', ar: 'قمح صلب ممتاز للكسكس والسميد.' },
      price: 95.0,
      unit: 'KG' as const,
      stock: 1900,
      tags: ['grains', 'wheat', 'setif'],
    },
    {
      producerId: constantineProducer.id,
      categoryId: fruitsCat.id,
      slug: 'constantine-apples',
      title: { en: 'Mountain Apples', ar: 'تفاح جبلي' },
      description: { en: 'Sweet apples from elevated orchards.', ar: 'تفاح حلو من بساتين المرتفعات.' },
      price: 320.0,
      unit: 'KG' as const,
      stock: 280,
      tags: ['fruits', 'apples', 'constantine'],
    },
    {
      producerId: biskraProducer.id,
      categoryId: fruitsCat.id,
      slug: 'deglet-nour-dates-biskra',
      title: { en: 'Deglet Nour Dates', ar: 'تمر دقلة نور' },
      description: { en: 'Selected Deglet Nour dates from Biskra oasis.', ar: 'تمر دقلة نور مختار من واحات بسكرة.' },
      price: 780.0,
      unit: 'KG' as const,
      stock: 620,
      tags: ['dates', 'biskra', 'premium'],
    },
    {
      producerId: blidaProducer.id,
      categoryId: dairyCat.id,
      slug: 'farm-yogurt-mitidja',
      title: { en: 'Farm Yogurt', ar: 'ياغورت المزرعة' },
      description: { en: 'Traditional fresh yogurt.', ar: 'ياغورت تقليدي طازج.' },
      price: 85.0,
      unit: 'PIECE' as const,
      stock: 540,
      tags: ['dairy', 'yogurt', 'fresh'],
    },
  ];

  for (const product of extraProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        producerId: product.producerId,
        categoryId: product.categoryId,
        title: product.title,
        description: product.description,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        status: 'ACTIVE',
        tags: product.tags,
      },
      create: {
        producerId: product.producerId,
        categoryId: product.categoryId,
        title: product.title,
        description: product.description,
        slug: product.slug,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        status: 'ACTIVE',
        tags: product.tags,
      },
    });
  }

  const categoryMap = {
    vegetables: vegetablesCat,
    fresh: freshCat,
    fruits: fruitsCat,
    herbs: herbsCat,
    honey: honeyCat,
    meats: meatsCat,
    eggs: eggsCat,
  } as const;

  const selectedProducerProducts = [
    {
      baseSlug: 'blida-strawberries',
      titleEn: 'Blida Strawberries',
      titleAr: 'فراولة البليدة',
      descriptionEn: 'Sweet strawberries harvested at peak ripeness.',
      descriptionAr: 'فراولة حلوة تُقطف عند ذروة النضج.',
      category: 'fruits',
      price: 420,
      unit: 'KG' as const,
      stock: 180,
      tags: ['strawberries', 'fresh'],
      imageUrl:
        'https://images.pexels.com/photos/89778/strawberries-frisch-ripe-sweet-89778.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'setif-pears',
      titleEn: 'Setif Golden Pears',
      titleAr: 'إجاص سطيف الذهبي',
      descriptionEn: 'Golden pears with a crisp bite and floral aroma.',
      descriptionAr: 'إجاص ذهبي مقرمش برائحة زهرية.',
      category: 'fruits',
      price: 360,
      unit: 'KG' as const,
      stock: 220,
      tags: ['pears', 'fresh'],
      imageUrl:
        'https://images.pexels.com/photos/568471/pexels-photo-568471.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'constantine-apricots',
      titleEn: 'Constantine Apricots',
      titleAr: 'مشمش قسنطينة',
      descriptionEn: 'Sun-ripened apricots, soft and fragrant.',
      descriptionAr: 'مشمش ناضج تحت الشمس بطراوة وعطر.',
      category: 'fruits',
      price: 390,
      unit: 'KG' as const,
      stock: 210,
      tags: ['apricots', 'seasonal'],
      imageUrl:
        'https://images.pexels.com/photos/1402528/pexels-photo-1402528.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'biskra-onions',
      titleEn: 'Biskra Desert Onions',
      titleAr: 'بصل بسكرة الصحراوي',
      descriptionEn: 'Firm onions with a mild, sweet finish.',
      descriptionAr: 'بصل متماسك بطعم خفيف وحلاوة لطيفة.',
      category: 'vegetables',
      price: 160,
      unit: 'KG' as const,
      stock: 420,
      tags: ['onions', 'daily'],
      imageUrl:
        'https://images.pexels.com/photos/4197447/pexels-photo-4197447.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'algiers-farm-chicken',
      titleEn: 'Algiers Farm Chicken',
      titleAr: 'دجاج بلدي من الجزائر',
      descriptionEn: 'Free-range chicken sourced from small farms.',
      descriptionAr: 'دجاج بلدي من مزارع صغيرة حرة المراعي.',
      category: 'meats',
      price: 720,
      unit: 'KG' as const,
      stock: 140,
      tags: ['chicken', 'farm'],
      imageUrl:
        'https://images.pexels.com/photos/616401/pexels-photo-616401.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
  ];

  const productTemplates = [
    {
      baseSlug: 'mitidja-oranges',
      titleEn: 'Mitidja Citrus Oranges',
      titleAr: 'برتقال متيجة الحمضي',
      descriptionEn: 'Juicy oranges from the Mitidja plain.',
      descriptionAr: 'برتقال عصيري من سهل متيجة.',
      category: 'fruits',
      price: 260,
      unit: 'KG' as const,
      stock: 420,
      tags: ['citrus', 'local'],
      imageUrl:
        'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'souk-el-had-tomatoes',
      titleEn: 'Souk El Had Tomatoes',
      titleAr: 'طماطم سوق الأحد الطازجة',
      descriptionEn: 'Fresh tomatoes picked daily.',
      descriptionAr: 'طماطم طازجة تُقطف يومياً.',
      category: 'vegetables',
      price: 190,
      unit: 'KG' as const,
      stock: 360,
      tags: ['tomatoes', 'fresh'],
      imageUrl:
        'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'ain-defla-eggs',
      titleEn: 'Ain Defla Free-range Eggs',
      titleAr: 'بيض بلدي من عين الدفلى',
      descriptionEn: 'Farm fresh free-range eggs.',
      descriptionAr: 'بيض بلدي طازج من المزارع.',
      category: 'eggs',
      price: 45,
      unit: 'PIECE' as const,
      stock: 520,
      tags: ['eggs', 'farm'],
      imageUrl:
        'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'blida-potatoes',
      titleEn: 'Blida Potatoes',
      titleAr: 'بطاطا البليدة',
      descriptionEn: 'Everyday potatoes for home cooking.',
      descriptionAr: 'بطاطا يومية للطهي المنزلي.',
      category: 'vegetables',
      price: 180,
      unit: 'KG' as const,
      stock: 520,
      tags: ['potatoes', 'daily'],
      imageUrl:
        'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'setif-apples',
      titleEn: 'Setif Apples',
      titleAr: 'تفاح سطيف',
      descriptionEn: 'Crisp apples from Setif orchards.',
      descriptionAr: 'تفاح مقرمش من بساتين سطيف.',
      category: 'fruits',
      price: 320,
      unit: 'KG' as const,
      stock: 280,
      tags: ['apples', 'fresh'],
      imageUrl:
        'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      baseSlug: 'farm-chicken',
      titleEn: 'Farm Chicken',
      titleAr: 'دجاج بلدي',
      descriptionEn: 'Fresh farm chicken, ready for cooking.',
      descriptionAr: 'دجاج بلدي طازج جاهز للطبخ.',
      category: 'meats',
      price: 680,
      unit: 'KG' as const,
      stock: 240,
      tags: ['chicken', 'farm'],
      imageUrl:
        'https://images.pexels.com/photos/616401/pexels-photo-616401.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
  ];

  const producerList = [
    { id: producerProfile.id, label: producerProfile.businessName },
    ...extraProducerProfiles.map((profile) => ({ id: profile.id, label: profile.businessName })),
  ];

  const algerianProducts: Array<{ id: string; imageUrl: string; titleEn: string }> = [];
  let templateIndex = 0;

  for (const [producerIndex, producer] of producerList.entries()) {
    if (selectedProducerIdSet.has(producer.id)) {
      continue;
    }
    const itemsPerProducer = 1 + (producerIndex % 3);

    for (let i = 0; i < itemsPerProducer; i += 1) {
      const template = productTemplates[templateIndex % productTemplates.length];
      templateIndex += 1;

      const slug = `${template.baseSlug}-${templateIndex}`;
      const created = await prisma.product.upsert({
        where: { slug },
        update: {
          producerId: producer.id,
          categoryId: categoryMap[template.category].id,
          title: { en: template.titleEn, ar: template.titleAr },
          description: { en: template.descriptionEn, ar: template.descriptionAr },
          price: template.price,
          unit: template.unit,
          stock: template.stock,
          status: 'ACTIVE',
          tags: template.tags,
        },
        create: {
          producerId: producer.id,
          categoryId: categoryMap[template.category].id,
          title: { en: template.titleEn, ar: template.titleAr },
          description: { en: template.descriptionEn, ar: template.descriptionAr },
          slug,
          price: template.price,
          unit: template.unit,
          stock: template.stock,
          status: 'ACTIVE',
          tags: template.tags,
        },
      });

      algerianProducts.push({ id: created.id, imageUrl: template.imageUrl, titleEn: template.titleEn });
    }
  }

  if (selectedProducerProfiles.length > 0) {
    const selectedProductIds = await prisma.product.findMany({
      where: { producerId: { in: selectedProducerProfiles.map((profile) => profile.id) } },
      select: { id: true },
    });

    if (selectedProductIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: { in: selectedProductIds.map((product) => product.id) } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: selectedProductIds.map((product) => product.id) } },
      });
    }

    for (const [index, producer] of selectedProducerProfiles.entries()) {
      const template = selectedProducerProducts[index % selectedProducerProducts.length];
      const slug = `${template.baseSlug}-${producer.id.slice(0, 6)}`;
      const created = await prisma.product.upsert({
        where: { slug },
        update: {
          producerId: producer.id,
          categoryId: categoryMap[template.category].id,
          title: { en: template.titleEn, ar: template.titleAr },
          description: { en: template.descriptionEn, ar: template.descriptionAr },
          price: template.price,
          unit: template.unit,
          stock: template.stock,
          status: 'ACTIVE',
          tags: template.tags,
        },
        create: {
          producerId: producer.id,
          categoryId: categoryMap[template.category].id,
          title: { en: template.titleEn, ar: template.titleAr },
          description: { en: template.descriptionEn, ar: template.descriptionAr },
          slug,
          price: template.price,
          unit: template.unit,
          stock: template.stock,
          status: 'ACTIVE',
          tags: template.tags,
        },
      });

      algerianProducts.push({ id: created.id, imageUrl: template.imageUrl, titleEn: template.titleEn });
    }
  }

  console.log(
    `[seed] Upserted ${6 + extraProducts.length + algerianProducts.length} products`
  );

  // ── Product Images (royalty-free placeholder photos for dev/demo) ─────────
  const tomatoImages = [
    'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4110307/pexels-photo-4110307.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2893635/pexels-photo-2893635.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const oliveImages = [
    'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/404070/pexels-photo-404070.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/726281/pexels-photo-726281.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1371205/pexels-photo-1371205.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const orangeImages = [
    'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const mintImages = [
    'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1055379/pexels-photo-1055379.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const honeyImages = [
    'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const eggImages = [
    'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6941016/pexels-photo-6941016.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  await prisma.productImage.deleteMany({
    where: {
      productId: { in: [tomato.id, oliveOil.id, oranges.id, mint.id, honey.id, eggs.id] },
    },
  });

  await prisma.productImage.createMany({
    data: [
      ...tomatoImages.map((url, index) => ({
        productId: tomato.id,
        url,
        altText: `Fresh tomatoes photo ${index + 1}`,
        position: index,
      })),
      ...oliveImages.map((url, index) => ({
        productId: oliveOil.id,
        url,
        altText: `Olive oil photo ${index + 1}`,
        position: index,
      })),
      ...orangeImages.map((url, index) => ({
        productId: oranges.id,
        url,
        altText: `Oranges photo ${index + 1}`,
        position: index,
      })),
      ...mintImages.map((url, index) => ({
        productId: mint.id,
        url,
        altText: `Mint photo ${index + 1}`,
        position: index,
      })),
      ...honeyImages.map((url, index) => ({
        productId: honey.id,
        url,
        altText: `Honey photo ${index + 1}`,
        position: index,
      })),
      ...eggImages.map((url, index) => ({
        productId: eggs.id,
        url,
        altText: `Eggs photo ${index + 1}`,
        position: index,
      })),
    ],
  });

  if (algerianProducts.length > 0) {
    await prisma.productImage.deleteMany({
      where: {
        productId: { in: algerianProducts.map((product) => product.id) },
      },
    });

    await prisma.productImage.createMany({
      data: algerianProducts.map((product) => ({
        productId: product.id,
        url: product.imageUrl,
        altText: `${product.titleEn} photo`,
        position: 0,
      })),
    });
  }

  console.log('[seed] Seeded 20 product images');

  const productsWithoutImages = await prisma.product.findMany({
    where: {
      images: {
        none: {},
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (productsWithoutImages.length > 0) {
    await prisma.productImage.createMany({
      data: productsWithoutImages.map((product) => ({
        productId: product.id,
        url: 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=1200',
        altText: `${product.slug.replace(/-/g, ' ')} cover photo`,
        position: 0,
      })),
    });
  }

  console.log(`[seed] Added fallback cover images to ${productsWithoutImages.length} products`);

  const buyerAddress =
    (await prisma.address.findFirst({
      where: { userId: buyerUser.id, label: 'seed-home' },
    })) ??
    (await prisma.address.create({
      data: {
        userId: buyerUser.id,
        label: 'seed-home',
        recipientName: buyerUser.fullName,
        phone: '+213555000111',
        wilaya: '24 - Guelma',
        commune: 'Guelma',
        street: 'Cite 20 Aout',
        postalCode: '24000',
        isDefault: true,
      },
    }));

  const deliveredSeedOrder = await prisma.order.findFirst({
    where: {
      buyerId: buyerUser.id,
      notes: 'seed-demo-delivered-order',
    },
    select: { id: true },
  });

  if (!deliveredSeedOrder) {
    const order = await prisma.order.create({
      data: {
        buyerId: buyerUser.id,
        buyerAddressId: buyerAddress.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveryStatus: 'DELIVERED',
        deliveryMethod: 'DELIVERY',
        total: 240,
        currency: 'DZD',
        notes: 'seed-demo-delivered-order',
        verifiedAt: new Date(),
      } as any,
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: tomato.id,
        productSnapshot: {
          title: tomato.title as unknown as Prisma.InputJsonValue,
          imageUrl: tomatoImages[0],
          unit: 'KG',
          recipePdfUrl: null,
        },
        quantity: 2,
        unitPrice: 120,
        total: 240,
        currency: 'DZD',
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'CASH_ON_DELIVERY',
        status: 'PAID',
        amount: 240,
        currency: 'DZD',
        gatewayRef: `seed-paid-${order.id.slice(0, 8)}`,
        paidAt: new Date(),
      } as any,
    });
    console.log('[seed] Created 1 delivered demo order for review/rating tests');
  } else {
    console.log('[seed] Delivered demo order already exists - skipped');
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  const existingNotifCount = await prisma.notification.count({
    where: { userId: { in: [buyerUser.id, producerUser.id] } },
  });

  if (existingNotifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: buyerUser.id,
          type: 'GENERAL',
          channel: 'IN_APP',
          title: 'Welcome to FarmConnect!',
          body: 'Discover fresh produce directly from Algerian farmers.',
          data: {},
        },
        {
          userId: producerUser.id,
          type: 'PRODUCER_VERIFIED',
          channel: 'IN_APP',
          title: 'Profile Verified',
          body: 'Your producer profile has been approved. You can now list products.',
          data: {},
          sentAt: new Date(),
        },
      ],
    });
    console.log('[seed] Created 2 notifications');
  } else {
    console.log('[seed] Notifications already exist — skipped');
  }

  // ── Audit Log ──────────────────────────────────────────────────────────────
  const existingAuditCount = await prisma.auditLog.count({
    where: { actorId: admin.id, targetId: producerProfile.id },
  });

  if (existingAuditCount === 0) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        targetType: 'ProducerProfile',
        targetId: producerProfile.id,
        action: 'VERIFY',
        changes: { before: { verificationStatus: 'PENDING' }, after: { verificationStatus: 'APPROVED' } },
        ipAddress: '127.0.0.1',
      },
    });
    console.log('[seed] Created 1 audit log entry');
  } else {
    console.log('[seed] Audit log already exists — skipped');
  }

  // ── Analytics Daily ────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.analyticsDaily.upsert({
    where: { id: 'seed-analytics-today' },
    update: { newUsers: 3, newProducers: 1, newBuyers: 1 },
    create: {
      id: 'seed-analytics-today',
      date: today,
      newUsers: 3,
      newProducers: 1,
      newBuyers: 1,
      totalOrders: 0,
      totalRevenue: 0,
    },
  });

  console.log('[seed] Upserted 1 analytics daily snapshot');

  // ── AI Forecast ────────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  await prisma.aiForecast.upsert({
    where: { id: 'seed-forecast-vegetables-tomorrow' },
    update: {},
    create: {
      id: 'seed-forecast-vegetables-tomorrow',
      categoryId: vegetablesCat.id,
      forecastDate: tomorrow,
      predictedDemand: 1250.0,
      confidenceScore: 0.82,
      modelVersion: 'v1',
    },
  });

  console.log('[seed] Upserted 1 AI demand forecast');

  // ── AI Recommendation ──────────────────────────────────────────────────────
  await prisma.aiRecommendation.upsert({
    where: { userId_productId: { userId: buyerUser.id, productId: tomato.id } },
    update: { score: 0.94 },
    create: {
      userId: buyerUser.id,
      productId: tomato.id,
      score: 0.94,
      reason: 'Popular in your region this season',
    },
  });

  console.log('[seed] Upserted 1 AI product recommendation');

  console.log('[seed] Done ✓');
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

