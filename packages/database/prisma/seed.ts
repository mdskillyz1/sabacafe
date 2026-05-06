import { PrismaClient } from "@prisma/client";
import { businessInfo, defaultBusinessInfoSettings, menuCategories, menuItems, openingHours } from "@saba/shared";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      restaurantName: "Saba Cafe",
      restaurantPhone: businessInfo.phone,
      restaurantAddress: businessInfo.formattedAddress,
      businessName: defaultBusinessInfoSettings.businessName,
      copyrightText: defaultBusinessInfoSettings.copyrightText,
      address: defaultBusinessInfoSettings.address,
      email: defaultBusinessInfoSettings.email,
      phone: defaultBusinessInfoSettings.phone,
      openingHoursText: defaultBusinessInfoSettings.openingHoursText,
      socialLinks: defaultBusinessInfoSettings.socialLinks,
      googleReviewUrl: process.env.GOOGLE_REVIEW_URL ?? businessInfo.googleReviewUrl,
      googlePlaceId: process.env.GOOGLE_PLACE_ID,
      googleMapsEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ?? businessInfo.mapsEmbedUrl,
      minimumOrderPence: Number(process.env.MINIMUM_ORDER_PENCE ?? 1200),
      vatRate: Number(process.env.VAT_RATE ?? 0.2)
    }
  });

  for (const [index, row] of openingHours.entries()) {
    const [openTime, closeTime] = row.hours.split(" - ");
    await prisma.openingHours.upsert({
      where: { dayOfWeek: index + 1 },
      update: { openTime, closeTime, closed: false },
      create: { dayOfWeek: index + 1, openTime, closeTime, closed: false }
    });
  }

  await prisma.deliveryZone.upsert({
    where: { id: "se1-local" },
    update: {
      name: "SE1 local delivery",
      postcodePrefix: "SE1",
      radiusMiles: 3,
      deliveryFeePence: 350,
      minimumOrderPence: 1200,
      active: true
    },
    create: {
      id: "se1-local",
      name: "SE1 local delivery",
      postcodePrefix: "SE1",
      radiusMiles: 3,
      deliveryFeePence: 350,
      minimumOrderPence: 1200,
      active: true
    }
  });

  for (const category of menuCategories) {
    await prisma.menuCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category
    });
  }

  for (const [index, item] of menuItems.entries()) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        categoryId: item.categoryId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        pricePence: item.pricePence,
        image: item.image,
        allergens: item.allergens,
        spiceLevel: item.spiceLevel,
        halal: item.halal,
        available: item.available,
        popular: item.popular,
        recommended: item.recommended,
        prepMinutes: item.prepMinutes,
        sortOrder: index
      },
      create: {
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        pricePence: item.pricePence,
        image: item.image,
        allergens: item.allergens,
        spiceLevel: item.spiceLevel,
        halal: item.halal,
        available: item.available,
        popular: item.popular,
        recommended: item.recommended,
        prepMinutes: item.prepMinutes,
        sortOrder: index,
        options: {
          create: item.options.map((option) => ({
            name: option.name,
            priceDeltaPence: option.priceDeltaPence
          }))
        },
        addOns: {
          create: item.addOns.map((addOn) => ({
            name: addOn.name,
            pricePence: addOn.pricePence
          }))
        }
      }
    });
  }

  await prisma.promoCode.upsert({
    where: { code: "SABA10" },
    update: {},
    create: {
      code: "SABA10",
      description: "10% off first online order",
      percentOff: 10,
      firstOrderOnly: true,
      minSpendPence: 1200
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
