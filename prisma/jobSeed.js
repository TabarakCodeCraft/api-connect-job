const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.create({
    data: {
      email: 'test@company.com',
      companyName: 'شركة تجريبية',
      sector: 'الصحة',
      address: 'بغداد، العراق',
      phone: '+964700123456',
      fullname: 'أحمد محمد',
      governorate: 'BAGHDAD',
      jobTitle: 'GENERAL_MANAGER',
      secretCode: 'TEST123'
    }
  });

  console.log('Company created:', company.companyName);

  const jobs = [
    {
      companyId: company.id,
      jobTitle: 'MEDICAL_REPRESENTATIVE',
      description: 'نحن نبحث عن مندوب طبي ذو خبرة في مجال الأدوية والمبيعات الطبية',
      requirements: 'خبرة لا تقل عن سنتين في مجال المبيعات الطبية، معرفة جيدة بالمنطقة',
      governorate: 'BAGHDAD',
      specialization: 'INTERNAL_MEDICINE',
      salary: '1500000 دينار عراقي',
      contactEmail: 'hr@testcompany.com',
      contactPhone: '+964700123456',
      lineOfWork: 'INTERNAL_MEDICINE',
      gender: 'Male',
      carOwnership: 'YES'
    },
    {
      companyId: company.id,
      jobTitle: 'SALES_MANAGER',
      description: 'مدير مبيعات مطلوب لإدارة فريق المبيعات وتطوير استراتيجيات البيع',
      requirements: 'خبرة 5 سنوات في إدارة المبيعات، مهارات قيادية ممتازة',
      governorate: 'BASRAH',
      specialization: 'CARDIOLOGIST',
      salary: '2500000 دينار عراقي',
      contactEmail: 'hr@testcompany.com',
      contactPhone: '+964700123456',
      lineOfWork: 'CARDIOLOGIST',
      gender: 'Male',
      carOwnership: 'YES'
    },
    {
      companyId: company.id,
      jobTitle: 'PRODUCT_MANAGER',
      description: 'مدير منتج مطلوب لإدارة وتطوير المنتجات الطبية',
      requirements: 'خبرة في إدارة المنتجات الطبية، معرفة بالسوق المحلي',
      governorate: 'ERBIL',
      specialization: 'PEDIATRICS',
      salary: '2000000 دينار عراقي',
      contactEmail: 'hr@testcompany.com',
      contactPhone: '+964700123456',
      lineOfWork: 'PEDIATRICS',
      gender: 'Female',
      carOwnership: 'NO'
    },
    {
      companyId: company.id,
      jobTitle: 'HR_MANAGER',
      description: 'مدير موارد بشرية مطلوب لإدارة شؤون الموظفين والتوظيف',
      requirements: 'خبرة في إدارة الموارد البشرية، مهارات تواصل ممتازة',
      governorate: 'NINEVEH',
      specialization: 'GENERAL_PRACTITIONER',
      salary: '1800000 دينار عراقي',
      contactEmail: 'hr@testcompany.com',
      contactPhone: '+964700123456',
      lineOfWork: 'GENERAL_PRACTITIONER',
      gender: 'Female',
      carOwnership: 'YES'
    },
    {
      companyId: company.id,
      jobTitle: 'ACCOUNTANT',
      description: 'محاسب مطلوب لإدارة الحسابات والمالية',
      requirements: 'شهادة محاسبة، خبرة 3 سنوات في مجال المحاسبة',
      governorate: 'BAGHDAD',
      specialization: 'NURSES',
      salary: '1200000 دينار عراقي',
      contactEmail: 'hr@testcompany.com',
      contactPhone: '+964700123456',
      lineOfWork: 'NURSES',
      gender: 'Male',
      carOwnership: 'NO'
    }
  ];

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: jobData
    });
    console.log('Job created:', job.jobTitle);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 
