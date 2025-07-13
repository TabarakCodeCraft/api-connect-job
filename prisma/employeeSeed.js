const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // إنشاء مستخدم تجريبي
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'employee@test.com',
      username: 'testemployee',
      password: hashedPassword,
      role: 'EMPLOYEE',
      isActive: true
    }
  });

  console.log('User created:', user.email);

  // إنشاء ملف موظف تجريبي
  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      fullName: 'أحمد محمد علي',
      phone: '+964700123456',
      gender: 'Male',
      governorate: 'BAGHDAD',
      jobTitle: 'MEDICAL_REPRESENTATIVE',
      specialization: 'INTERNAL_MEDICINE',
      location: 'بغداد، العراق',
      carOwnership: 'YES',
      bio: 'مندوب طبي ذو خبرة 5 سنوات في مجال المبيعات الطبية',
      educations: [
        {
          id: 1,
          institution: 'جامعة بغداد',
          degree: 'بكالوريوس صيدلة',
          duration: '4 سنوات',
          description: 'تخصص في العلوم الصيدلانية',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      experiences: [
        {
          id: 1,
          company: 'شركة أدوية سابقة',
          position: 'MEDICAL_REPRESENTATIVE',
          lineOfWork: 'INTERNAL_MEDICINE',
          duration: '3 سنوات',
          description: 'عملت كمندوب طبي في منطقة بغداد',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  });

  console.log('Employee profile created:', employee.fullName);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 