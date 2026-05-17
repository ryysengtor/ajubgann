import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Banner from '@/models/Banner';
import Settings from '@/models/Settings';

export async function POST() {
  try {
    await connectDB();

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Banner.deleteMany({});
    await Settings.deleteMany({});

    // ─── Seed Categories ────────────────────────────────────────────────────
    const categories = await Category.insertMany([
      {
        name: 'Mobile Legends',
        slug: 'mobile-legends',
        icon: '⚔️',
        image: '',
        description: 'Akun Mobile Legends berkualitas. Rank tinggi, hero lengkap, skin premium!',
        order: 1,
        isActive: true,
      },
      {
        name: 'Free Fire',
        slug: 'free-fire',
        icon: '🔥',
        image: '',
        description: 'Akun Free Fire dengan koleksi skin dan karakter eksklusif.',
        order: 2,
      views: 801,
      likes: 29,
        isActive: true,
      },
      {
        name: 'Genshin Impact',
        slug: 'genshin-impact',
        icon: '🌟',
        image: '',
        description: 'Akun Genshin Impact dengan karakter dan senjata 5★ lengkap.',
        order: 3,
      views: 456,
      likes: 15,
        isActive: true,
      },
      {
        name: 'Valorant',
        slug: 'valorant',
        icon: '🎯',
        image: '',
        description: 'Akun Valorant dengan rank tinggi dan skin premium.',
        order: 4,
      views: 234,
      likes: 12,
        isActive: true,
      },
      {
        name: 'PUBG Mobile',
        slug: 'pubg-mobile',
        icon: '🪖',
        image: '',
        description: 'Akun PUBG Mobile dengan Royale Pass dan item eksklusif.',
        order: 5,
      views: 678,
      likes: 45,
        isActive: true,
      },
      {
        name: 'Honkai Star Rail',
        slug: 'honkai-star-rail',
        icon: '🚀',
        image: '',
        description: 'Akun Honkai Star Rail dengan karakter 5★ lengkap.',
        order: 6,
      views: 345,
      likes: 22,
        isActive: true,
      },
      {
        name: 'Higgs Domino',
        slug: 'higgs-domino',
        icon: '🎲',
        image: '',
        description: 'Akun Higgs Domino dengan koin emas melimpah.',
        order: 7,
      views: 890,
      likes: 67,
        isActive: true,
      },
      {
        name: 'Akun Lainnya',
        slug: 'akun-lainnya',
        icon: '🎮',
        image: '',
        description: 'Akun game lainnya dengan harga terbaik.',
        order: 8,
      views: 567,
      likes: 38,
        isActive: true,
      },
    ]);

    const ml = categories[0]._id;
    const ff = categories[1]._id;
    const gi = categories[2]._id;
    const val = categories[3]._id;
    const pubg = categories[4]._id;
    const hsr = categories[5]._id;
    const higgs = categories[6]._id;
    const other = categories[7]._id;

    // ─── Seed Products (Game Accounts) ─────────────────────────────────────

    const products = [];

    // === MOBILE LEGENDS ===
    products.push({
      name: 'Akun ML Mythic Glory 100+ Hero Full Skin',
      slug: 'akun-ml-mythic-glory-100-hero-full-skin',
      category: ml,
      description: 'Akun Mobile Legends Mythic Glory dengan 100+ hero dan skin premium lengkap. Akun sudah terverifikasi dan aman untuk transfer. Cocok untuk player yang ingin langsung bermain di rank tinggi.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Mythic Glory 700+' },
        { label: 'Jumlah Hero', value: '100+' },
        { label: 'Skin Epic+', value: '50+' },
        { label: 'Skin Legend', value: '20+' },
        { label: 'Level', value: '30' },
        { label: 'Emblem', value: 'Max All' },
        { label: 'Server', value: 'Indonesia' },
      ],
      price: 750000,
      originalPrice: 900000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 1,
      views: 997,
      likes: 33,
    });

    products.push({
      name: 'Akun ML Mythic 80+ Hero Banyak Skin',
      slug: 'akun-ml-mythic-80-hero-banyak-skin',
      category: ml,
      description: 'Akun Mobile Legends Mythic dengan koleksi hero lengkap dan skin premium. Siap main langsung di rank tinggi!',
      images: [],
      specs: [
        { label: 'Rank', value: 'Mythic 300+' },
        { label: 'Jumlah Hero', value: '80+' },
        { label: 'Skin Epic+', value: '30+' },
        { label: 'Level', value: '28' },
        { label: 'Emblem', value: 'Max 6' },
        { label: 'Server', value: 'Indonesia' },
      ],
      price: 350000,
      originalPrice: 400000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 2,
      views: 801,
      likes: 29,
    });

    products.push({
      name: 'Akun ML Epic 50+ Hero',
      slug: 'akun-ml-epic-50-hero',
      category: ml,
      description: 'Akun Mobile Legends Epic dengan 50+ hero. Cocok untuk pemula yang ingin naik rank.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Epic' },
        { label: 'Jumlah Hero', value: '50+' },
        { label: 'Skin', value: '15+' },
        { label: 'Level', value: '22' },
        { label: 'Server', value: 'Indonesia' },
      ],
      price: 75000,
      originalPrice: 90000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 3,
      views: 456,
      likes: 15,
    });

    products.push({
      name: 'Akun ML Legend 60+ Hero Skin Premium',
      slug: 'akun-ml-legend-60-hero-skin-premium',
      category: ml,
      description: 'Akun Mobile Legends Legend dengan hero dan skin premium. Akun bersih, tidak ada ban record.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Legend' },
        { label: 'Jumlah Hero', value: '60+' },
        { label: 'Skin Premium', value: '10+' },
        { label: 'Level', value: '25' },
        { label: 'Server', value: 'Indonesia' },
      ],
      price: 150000,
      originalPrice: 180000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 4,
      views: 234,
      likes: 12,
    });

    // === FREE FIRE ===
    products.push({
      name: 'Akun FF Heroic 100+ Skin Elite Pass',
      slug: 'akun-ff-heroic-100-skin-elite-pass',
      category: ff,
      description: 'Akun Free Fire Heroic dengan 100+ skin dan Elite Pass lengkap. Banyak karakter eksklusif dan bundle premium.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Heroic' },
        { label: 'Skin', value: '100+' },
        { label: 'Karakter', value: 'Semua' },
        { label: 'Elite Pass', value: 'Season 1-30+' },
        { label: 'Level', value: '75+' },
        { label: 'Region', value: 'Indonesia' },
      ],
      price: 450000,
      originalPrice: 550000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 5,
      views: 678,
      likes: 45,
    });

    products.push({
      name: 'Akun FF Diamond 50+ Skin',
      slug: 'akun-ff-diamond-50-skin',
      category: ff,
      description: 'Akun Free Fire Diamond rank dengan koleksi skin menarik dan karakter lengkap.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Diamond' },
        { label: 'Skin', value: '50+' },
        { label: 'Karakter', value: '30+' },
        { label: 'Level', value: '55+' },
        { label: 'Region', value: 'Indonesia' },
      ],
      price: 150000,
      originalPrice: 180000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 6,
      views: 345,
      likes: 22,
    });

    // === GENSHIN IMPACT ===
    products.push({
      name: 'Akun Genshin AR60 30+ Karakter 5★',
      slug: 'akun-genshin-ar60-30-karakter-5',
      category: gi,
      description: 'Akun Genshin Impact Adventure Rank 60 dengan 30+ karakter 5★ dan koleksi senjata 5★ lengkap. Akun endgame siap main.',
      images: [],
      specs: [
        { label: 'Adventure Rank', value: '60' },
        { label: 'Karakter 5★', value: '30+' },
        { label: 'Senjata 5★', value: '15+' },
        { label: 'Primogem', value: '0 (Clean)' },
        { label: 'Spiral Abyss', value: '36★ Full Clear' },
        { label: 'Server', value: 'Asia' },
      ],
      price: 2500000,
      originalPrice: 3000000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 7,
      views: 890,
      likes: 67,
    });

    products.push({
      name: 'Akun Genshin AR55 15+ Karakter 5★',
      slug: 'akun-genshin-ar55-15-karakter-5',
      category: gi,
      description: 'Akun Genshin Impact AR55 dengan 15+ karakter 5★ dan build siap Abyss. Akun semi-ender.',
      images: [],
      specs: [
        { label: 'Adventure Rank', value: '55' },
        { label: 'Karakter 5★', value: '15+' },
        { label: 'Senjata 5★', value: '8+' },
        { label: 'Spiral Abyss', value: '33★+' },
        { label: 'Server', value: 'Asia' },
      ],
      price: 850000,
      originalPrice: 1000000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 8,
      views: 567,
      likes: 38,
    });

    products.push({
      name: 'Akun Genshin Starter AR30 5+ Karakter 5★',
      slug: 'akun-genshin-starter-ar30',
      category: gi,
      description: 'Akun Genshin Impact starter AR30 dengan 5+ karakter 5★. Cocok untuk pemula yang ingin mulai dengan karakter bagus.',
      images: [],
      specs: [
        { label: 'Adventure Rank', value: '30+' },
        { label: 'Karakter 5★', value: '5+' },
        { label: 'Senjata 5★', value: '2+' },
        { label: 'Server', value: 'Asia' },
      ],
      price: 150000,
      originalPrice: 180000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 9,
      views: 123,
      likes: 8,
    });

    // === VALORANT ===
    products.push({
      name: 'Akun Valorant Immortal Full Agent + Skin',
      slug: 'akun-valorant-immortal-full-agent-skin',
      category: val,
      description: 'Akun Valorant rank Immortal dengan semua agent unlocked dan koleksi skin premium. Akun bersih, tidak pernah banned.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Immortal 1-3' },
        { label: 'Agent', value: 'Full Unlocked' },
        { label: 'Skin Premium', value: '20+' },
        { label: 'Skin Melee', value: '5+' },
        { label: 'Level', value: '200+' },
        { label: 'Region', value: 'SEA' },
      ],
      price: 600000,
      originalPrice: 750000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 10,
      views: 789,
      likes: 52,
    });

    products.push({
      name: 'Akun Valorant Platinum Full Agent',
      slug: 'akun-valorant-platinum-full-agent',
      category: val,
      description: 'Akun Valorant rank Platinum dengan semua agent unlocked. Cocok untuk ranked grind.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Platinum 1-3' },
        { label: 'Agent', value: 'Full Unlocked' },
        { label: 'Skin', value: '5+' },
        { label: 'Level', value: '80+' },
        { label: 'Region', value: 'SEA' },
      ],
      price: 200000,
      originalPrice: 250000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 11,
      views: 432,
      likes: 28,
    });

    products.push({
      name: 'Akun Valorant Gold + Skin Reaver Vandal',
      slug: 'akun-valorant-gold-reaver-vandal',
      category: val,
      description: 'Akun Valorant Gold dengan skin Reaver Vandal dan agent lengkap. Akun siap main!',
      images: [],
      specs: [
        { label: 'Rank', value: 'Gold 1-3' },
        { label: 'Agent', value: 'Full Unlocked' },
        { label: 'Skin Featured', value: 'Reaver Vandal' },
        { label: 'Level', value: '50+' },
        { label: 'Region', value: 'SEA' },
      ],
      price: 120000,
      originalPrice: 150000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 12,
      views: 654,
      likes: 41,
    });

    // === PUBG MOBILE ===
    products.push({
      name: 'Akun PUBG Conqueror RP Max + Skin Premium',
      slug: 'akun-pubg-conqueror-rp-max-skin-premium',
      category: pubg,
      description: 'Akun PUBG Mobile Conqueror dengan Royale Pass max dan skin premium lengkap. Akun aman, tidak ada ban record.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Conqueror' },
        { label: 'Royale Pass', value: 'Max Season' },
        { label: 'Skin Premium', value: '30+' },
        { label: 'UC Spent', value: '500K+' },
        { label: 'Level', value: '100+' },
        { label: 'Region', value: 'SEA' },
      ],
      price: 1500000,
      originalPrice: 1800000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 13,
      views: 999,
      likes: 78,
    });

    products.push({
      name: 'Akun PUBG Crown + RP Elite',
      slug: 'akun-pubg-crown-rp-elite',
      category: pubg,
      description: 'Akun PUBG Mobile Crown rank dengan Royale Pass Elite. Skin menarik dan item eksklusif.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Crown' },
        { label: 'Royale Pass', value: 'Elite Current' },
        { label: 'Skin', value: '15+' },
        { label: 'Level', value: '65+' },
        { label: 'Region', value: 'SEA' },
      ],
      price: 350000,
      originalPrice: 400000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 14,
      views: 543,
      likes: 35,
    });

    // === HONKAI STAR RAIL ===
    products.push({
      name: 'Akun HSR TL70 20+ Karakter 5★',
      slug: 'akun-hsr-tl70-20-karakter-5',
      category: hsr,
      description: 'Akun Honkai Star Rail Trailblaze Level 70 dengan 20+ karakter 5★. Build siap endgame, MoC 12 cleared!',
      images: [],
      specs: [
        { label: 'Trailblaze Level', value: '70' },
        { label: 'Karakter 5★', value: '20+' },
        { label: 'Light Cone 5★', value: '10+' },
        { label: 'MoC', value: '12 Full Clear' },
        { label: 'Server', value: 'Asia' },
      ],
      price: 1200000,
      originalPrice: 1400000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 15,
      views: 876,
      likes: 61,
    });

    products.push({
      name: 'Akun HSR Starter TL40 5+ Karakter 5★',
      slug: 'akun-hsr-starter-tl40',
      category: hsr,
      description: 'Akun Honkai Star Rail starter dengan 5+ karakter 5★. Cocok untuk pemula.',
      images: [],
      specs: [
        { label: 'Trailblaze Level', value: '40+' },
        { label: 'Karakter 5★', value: '5+' },
        { label: 'Light Cone 5★', value: '2+' },
        { label: 'Server', value: 'Asia' },
      ],
      price: 150000,
      originalPrice: 180000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 16,
      views: 321,
      likes: 18,
    });

    // === HIGGS DOMINO ===
    products.push({
      name: 'Akun Higgs Domino 1M Koin Emas',
      slug: 'akun-higgs-domino-1m-koin-emas',
      category: higgs,
      description: 'Akun Higgs Domino dengan 1 juta koin emas. Siap main di meja premium!',
      images: [],
      specs: [
        { label: 'Koin Emas', value: '1.000.000' },
        { label: 'Level', value: '50+' },
        { label: 'VIP', value: 'VIP 5+' },
        { label: 'Item Premium', value: '10+' },
      ],
      price: 85000,
      originalPrice: 100000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 17,
      views: 765,
      likes: 49,
    });

    products.push({
      name: 'Akun Higgs Domino 5M Koin Emas',
      slug: 'akun-higgs-domino-5m-koin-emas',
      category: higgs,
      description: 'Akun Higgs Domino dengan 5 juta koin emas. Langsung main di meja high roller!',
      images: [],
      specs: [
        { label: 'Koin Emas', value: '5.000.000' },
        { label: 'Level', value: '80+' },
        { label: 'VIP', value: 'VIP 8+' },
        { label: 'Item Premium', value: '25+' },
      ],
      price: 350000,
      originalPrice: 400000,
      isActive: true,
      isFeatured: true,
      isSold: false,
      order: 18,
      views: 432,
      likes: 32,
    });

    // === AKUN LAINNYA ===
    products.push({
      name: 'Akun Call of Duty Mobile Legendary',
      slug: 'akun-cod-mobile-legendary',
      category: other,
      description: 'Akun COD Mobile Legendary rank dengan skin premium dan battle pass lengkap.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Legendary' },
        { label: 'Skin Premium', value: '20+' },
        { label: 'Battle Pass', value: 'Season 1-15+' },
        { label: 'Level', value: '150+' },
      ],
      price: 250000,
      originalPrice: 300000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 19,
      views: 567,
      likes: 37,
    });

    products.push({
      name: 'Akun Arena of Valor Master 80+ Hero',
      slug: 'akun-aov-master-80-hero',
      category: other,
      description: 'Akun Arena of Valor Master rank dengan 80+ hero dan skin premium.',
      images: [],
      specs: [
        { label: 'Rank', value: 'Master' },
        { label: 'Hero', value: '80+' },
        { label: 'Skin Premium', value: '15+' },
        { label: 'Level', value: '50+' },
      ],
      price: 200000,
      originalPrice: 250000,
      isActive: true,
      isFeatured: false,
      isSold: false,
      order: 20,
      views: 890,
      likes: 55,
    });

    await Product.insertMany(products);

    // ─── Seed Banners ──────────────────────────────────────────────────────
    await Banner.insertMany([
      {
        imageUrl: '/banners/banner1.png',
        title: 'Craig Of The Creek',
        description: 'Platform jual beli akun game terpercaya. Akun game berkualitas, harga bersahabat, bayar QRIS!',
        link: '',
        order: 1,
        isActive: true,
      },
      {
        imageUrl: '/banners/banner2.png',
        title: 'Akun Game Premium',
        description: 'Dapatkan akun game impianmu dengan harga terbaik. Proses kilat, bergaransi!',
        link: '',
        order: 2,
      views: 801,
      likes: 29,
        isActive: true,
      },
    ]);

    // ─── Seed Settings ──────────────────────────────────────────────────────
    await Settings.create({
      siteName: 'Craig Of The Creek',
      siteDescription: 'Platform jual beli akun game terpercaya. Akun game berkualitas, harga bersahabat, bayar QRIS!',
      siteSlogan: 'Adventure Awaits, Dapatkan Akun Impianmu!',
      logoUrl: '/logo.svg',
      ogImageUrl: '',
      whatsappNumber: '6283856801224',
      telegramUsername: '@craigofthecreek',
      instagramUrl: '',
      maintenanceMode: false,
      qrisExpiredMinutes: 15,
    });

    return NextResponse.json({
      status: 201,
      message: 'Database seeded successfully',
      data: {
        categories: categories.length,
        products: products.length,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
