const User = require('../models/User');
const Service = require('../models/Service');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');
const SiteContent = require('../models/SiteContent');
const Banner = require('../models/Banner');
const bcrypt = require('bcryptjs');
const { isStrongPassword } = require('./validation');

const services = [
  { title: 'House Painting', slug: 'house-painting', shortDescription: 'Complete house painting with premium paints for a beautiful, long-lasting finish.', description: '<p>Transform your home with our professional house painting services. We use premium quality paints from top brands like Asian Paints, Berger, and Nerolac to give your home a beautiful, durable finish that lasts for years.</p><p>Our expert painters ensure thorough surface preparation, priming, and application of multiple coats for the best results.</p>', icon: '🏠', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80', features: ['Premium quality paints', 'Expert painters', 'Surface preparation', 'Multiple coat application', 'Clean work guarantee', 'On-time completion'], metaTitle: 'House Painting in Gorakhpur | Munnalal Painter', metaDescription: 'Professional house painting services in Gorakhpur. Premium paints, expert painters, affordable prices. Call for free estimate.', order: 1 },
  { title: 'Interior Painting', slug: 'interior-painting', shortDescription: 'Beautiful interior painting that transforms your living spaces with perfect finishes.', description: '<p>Our interior painting services cover all rooms — bedrooms, living rooms, kitchens, and bathrooms. We specialize in creating beautiful, durable finishes that complement your interior design.</p>', icon: '🎨', image: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?auto=format&fit=crop&w=800&q=80', features: ['All room coverage', 'Color consultation', 'Premium interior paints', 'Smooth finish', 'Low VOC options', 'Furniture protection'], metaTitle: 'Interior Painting in Gorakhpur | Munnalal Painter', metaDescription: 'Expert interior painting services in Gorakhpur. Beautiful finishes for all rooms. Free color consultation.', order: 2 },
  { title: 'Exterior Painting', slug: 'exterior-painting', shortDescription: 'Weather-resistant exterior painting that protects and beautifies your property.', description: '<p>Protect your property from harsh weather while enhancing its curb appeal with our professional exterior painting services. We use weather-resistant paints that withstand rain, heat, and UV exposure.</p>', icon: '🏗️', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', features: ['Weather-resistant paints', 'UV protection', 'Anti-fungal coating', 'Pressure washing', 'Crack filling', 'Long-lasting finish'], metaTitle: 'Exterior Painting in Gorakhpur | Munnalal Painter', metaDescription: 'Professional exterior painting in Gorakhpur. Weather-resistant, UV-protected paints. Protects your property year-round.', order: 3 },
  { title: 'Texture Painting', slug: 'texture-painting', shortDescription: 'Stunning texture painting designs that add character and dimension to your walls.', description: '<p>Add a unique artistic touch to your walls with our texture painting services. From subtle sand textures to bold 3D patterns, we create stunning visual effects that make your walls stand out.</p>', icon: '✨', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', features: ['Custom texture designs', '3D effect options', 'Sand texture', 'Stone texture', 'Stucco finish', 'Designer patterns'], metaTitle: 'Texture Painting in Gorakhpur | Munnalal Painter', metaDescription: 'Expert texture painting services in Gorakhpur. Custom 3D designs, sand textures, stone effects. Transform your walls today.', order: 4 },
];

const defaultBanners = [
  {
    title: 'Transform Your Home with Colors That Last',
    subtitle: "Professional house painting, interior & exterior painting, texture painting, waterproofing and POP design in Gorakhpur. 15+ years of excellence, 2500+ projects completed.",
    ctaText: '🎨 Get Free Estimate',
    ctaLink: '/free-estimate',
    image: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?auto=format&fit=crop&w=1920&q=80',
    isActive: true,
    isPrimary: true,
    order: 1,
  },
  {
    title: "Gorakhpur's #1 Premium Painting & Decorating Service",
    subtitle: "Give your walls a luxury makeover with top quality paints, 3D texture patterns, and 1-year warranty on every job.",
    ctaText: '📞 Call Now',
    ctaLink: 'tel:7668415684',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1920&q=80',
    isActive: true,
    isPrimary: false,
    order: 2,
  },
];

const faqs = [
  { question: 'How much does house painting cost in Gorakhpur?', answer: 'The cost of house painting in Gorakhpur depends on various factors including the size of the area, type of paint, number of coats, and surface condition. Typically, it ranges from ₹8-25 per square foot. Contact us for a free detailed estimate specific to your project.', category: 'Pricing', order: 1 },
  { question: 'How long does it take to paint a 2BHK apartment?', answer: 'A standard 2BHK apartment (approximately 800-1000 sq ft) typically takes 3-5 days to complete, including surface preparation, putty application, primer, and 2 coats of paint. The exact timeline depends on the condition of walls and the type of finish required.', category: 'Timeline', order: 2 },
];

const testimonials = [
  { name: 'Rajesh Kumar Gupta', designation: 'Home Owner', location: 'Civil Lines, Gorakhpur', message: 'Munnalal Painter did an excellent job on our 3BHK home. The finish is absolutely perfect, they completed work on time, and the price was very reasonable. The team was professional, clean, and respectful of our space. Highly recommend!', rating: 5, isFeatured: true, order: 1 },
];

const defaultContent = [
  { key: 'hero_title', value: 'Gorakhpur\'s Most Trusted Painting Service', type: 'text', label: 'Hero Title', group: 'home' },
  { key: 'hero_subtitle', value: 'Premium Quality Painting for Homes, Offices & Commercial Spaces in Gorakhpur', type: 'text', label: 'Hero Subtitle', group: 'home' },
];

const PLACEHOLDER_EMAILS = ['your-admin-email@example.com', 'admin@example.com', 'your_email@gmail.com'];

const syncAdminAccount = async (targetEmail, password) => {
  const existingAdmin = await User.findOne({ email: targetEmail }).select('+password');
  if (!existingAdmin) return false;

  let updated = false;
  if (!existingAdmin.isActive) {
    existingAdmin.isActive = true;
    updated = true;
  }
  if (!existingAdmin.password.startsWith('$2a$') && !existingAdmin.password.startsWith('$2b$')) {
    existingAdmin.password = await bcrypt.hash(existingAdmin.password, 12);
    updated = true;
  } else if (process.env.ADMIN_PASSWORD && isStrongPassword(process.env.ADMIN_PASSWORD)) {
    const isSamePassword = await bcrypt.compare(process.env.ADMIN_PASSWORD, existingAdmin.password);
    if (!isSamePassword) {
      existingAdmin.password = process.env.ADMIN_PASSWORD;
      updated = true;
    }
  } else if (!process.env.ADMIN_PASSWORD) {
    const hasLegacyFallback = await bcrypt.compare('Munnalal@2026!Admin', existingAdmin.password);
    if (hasLegacyFallback) {
      existingAdmin.password = password;
      updated = true;
    }
  }

  if (updated) {
    await existingAdmin.save();
    console.log(`👤 Admin account synchronized from environment for: ${existingAdmin.email}`);
  }
  return true;
};

const autoSeed = async () => {
  try {
    const rawEnvEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminEmail = (rawEnvEmail && !PLACEHOLDER_EMAILS.includes(rawEnvEmail))
      ? rawEnvEmail
      : 'amannishad6476@gmail.com';
    const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    if (process.env.ADMIN_PASSWORD && !isStrongPassword(process.env.ADMIN_PASSWORD)) {
      console.warn('⚠️ ADMIN_PASSWORD in environment does not meet complexity requirements (min 12 chars, uppercase, lowercase, number, special char). Using default fallback password.');
    }
    const password = isStrongPassword(rawPassword) ? rawPassword : 'Admin@123456';

    const existingAdmin = await User.findOne({
      $or: [
        { email: adminEmail },
        { role: { $in: ['admin', 'superadmin'] } },
      ],
    }).select('+password');

    if (existingAdmin) {
      let updated = false;

      if (existingAdmin.email !== adminEmail) {
        existingAdmin.email = adminEmail;
        updated = true;
      }

      if (!existingAdmin.isActive) {
        existingAdmin.isActive = true;
        updated = true;
      }

      if (!existingAdmin.password.startsWith('$2a$') && !existingAdmin.password.startsWith('$2b$')) {
        existingAdmin.password = await bcrypt.hash(existingAdmin.password, 12);
        updated = true;
      } else if (process.env.ADMIN_PASSWORD && isStrongPassword(process.env.ADMIN_PASSWORD)) {
        const isSamePassword = await bcrypt.compare(process.env.ADMIN_PASSWORD, existingAdmin.password);
        if (!isSamePassword) {
          existingAdmin.password = process.env.ADMIN_PASSWORD;
          updated = true;
        }
      } else if (!process.env.ADMIN_PASSWORD) {
        const hasLegacyFallback = await bcrypt.compare('Munnalal@2026!Admin', existingAdmin.password);
        if (hasLegacyFallback) {
          existingAdmin.password = password;
          updated = true;
        }
      }

      if (updated) {
        await existingAdmin.save();
        console.log(`👤 Admin account synchronized from environment for: ${existingAdmin.email}`);
      }
    } else {
      await User.create({
        name: 'Munnalal Painter Admin',
        email: adminEmail,
        password,
        role: 'superadmin',
        isActive: true,
      });
      console.log(`👤 Admin account initialized securely for: ${adminEmail}`);
    }

    // If legacy placeholder admin@munnalalpainter.com is set in ADMIN_EMAIL, also ensure owner email is initialized
    if (adminEmail === 'admin@munnalalpainter.com') {
      const ownerEmail = 'amannishad6476@gmail.com';
      const ownerExists = await syncAdminAccount(ownerEmail, password);
      if (!ownerExists) {
        await User.create({
          name: 'Munnalal Painter Admin',
          email: ownerEmail,
          password,
          role: 'superadmin',
          isActive: true,
        });
        console.log(`👤 Owner admin account initialized securely for: ${ownerEmail}`);
      }
    }

    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(services);
      console.log(`📦 Seeded default services`);
    }

    const bannerCount = await Banner.countDocuments();
    if (bannerCount === 0) {
      await Banner.insertMany(defaultBanners);
      console.log(`🖼️ Seeded default hero banners`);
    }

    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      await FAQ.insertMany(faqs);
      console.log(`❓ Seeded default FAQs`);
    }

    const testimonialCount = await Testimonial.countDocuments();
    if (testimonialCount === 0) {
      await Testimonial.insertMany(testimonials);
      console.log(`⭐ Seeded default testimonials`);
    }

    const contentCount = await SiteContent.countDocuments();
    if (contentCount === 0) {
      await SiteContent.insertMany(defaultContent);
      console.log(`📝 Seeded default site content`);
    }
  } catch (error) {
    console.error('Auto-seed warning:', error.message);
  }
};

module.exports = autoSeed;
