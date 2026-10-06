const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`🚀 Starting Full Local System Backup to: ${backupDir}`);

  // 1. Fetch all profiles with relations
  const profiles = await prisma.profile.findMany({
    include: {
      user: true,
      photos: true,
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch all payments
  const payments = await prisma.payment.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Fetch all GST Invoices (payments with invoiceNumber)
  const invoices = payments.filter(p => p.invoiceNumber);

  // 4. Fetch all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // 5. Fetch admin settings
  const settings = await prisma.adminSetting.findFirst();

  // Save Full JSON Snapshot
  const fullSnapshot = {
    backupDate: new Date().toISOString(),
    stats: {
      totalProfiles: profiles.length,
      totalUsers: users.length,
      totalPayments: payments.length,
      totalInvoices: invoices.length,
    },
    profiles,
    payments,
    users,
    settings,
  };

  fs.writeFileSync(
    path.join(backupDir, 'full-database-snapshot.json'),
    JSON.stringify(fullSnapshot, null, 2),
    'utf-8'
  );

  // Helper to escape CSV values
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Generate Profiles CSV
  const profileHeaders = [
    'RishteClub ID',
    'Old NNVS ID',
    'Full Name',
    'Gender',
    'Mobile',
    'Date of Birth',
    'Birth Place',
    'Birth Time',
    'Manglik',
    'Marital Status',
    'Religion',
    'Caste',
    'Mother Tongue',
    'Height',
    'Diet',
    'Highest Qualification',
    'College',
    'Profession',
    'Company',
    'Annual Income',
    'Father Name',
    'Father Occupation',
    'Mother Name',
    'Mother Occupation',
    'Brothers',
    'Sisters',
    'Family Status',
    'Family Type',
    'Payment Status',
    'Approval Status',
    'Contact Person',
    'Notes',
    'Primary Photo URL',
    'Created At',
  ];

  const profileRows = profiles.map(p => [
    escapeCsv(p.profileId),
    escapeCsv(p.legacyProfileId),
    escapeCsv(p.user?.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()),
    escapeCsv(p.user?.gender),
    escapeCsv(p.user?.mobile),
    escapeCsv(p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : ''),
    escapeCsv(p.birthPlace),
    escapeCsv(p.birthTime),
    escapeCsv(p.manglik),
    escapeCsv(p.maritalStatus),
    escapeCsv(p.religion),
    escapeCsv(p.caste),
    escapeCsv(p.motherTongue),
    escapeCsv(p.height),
    escapeCsv(p.diet),
    escapeCsv(p.education?.highestQualification),
    escapeCsv(p.education?.college),
    escapeCsv(p.occupation?.profession),
    escapeCsv(p.occupation?.company),
    escapeCsv(p.occupation?.annualIncome),
    escapeCsv(p.family?.fatherName),
    escapeCsv(p.family?.fatherOccupation),
    escapeCsv(p.family?.motherName),
    escapeCsv(p.family?.motherOccupation),
    escapeCsv(p.family?.brothers),
    escapeCsv(p.family?.sisters),
    escapeCsv(p.family?.familyStatus),
    escapeCsv(p.family?.familyType),
    escapeCsv(p.paymentCompleted ? 'COMPLETED' : 'PENDING'),
    escapeCsv(p.approvalStatus),
    escapeCsv(p.contactPerson),
    escapeCsv(p.notes),
    escapeCsv(p.photos?.find(ph => ph.isPrimary)?.imageUrl || p.photos?.[0]?.imageUrl || ''),
    escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ''),
  ]);

  const profilesCsvContent = [profileHeaders.join(','), ...profileRows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(path.join(backupDir, 'profiles-all.csv'), profilesCsvContent, 'utf-8');

  // Generate Invoices CSV
  const invoiceHeaders = [
    'Invoice Number',
    'Invoice Date',
    'Profile ID',
    'Customer Name',
    'Mobile',
    'Taxable Amount',
    'GST Rate',
    'GST Amount',
    'Gross Amount (Total)',
    'Payment Gateway',
    'Transaction ID',
    'Status',
    'Invoice URL',
  ];

  const invoiceRows = invoices.map(inv => [
    escapeCsv(inv.invoiceNumber),
    escapeCsv(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : ''),
    escapeCsv(inv.profileId),
    escapeCsv(inv.user?.fullName),
    escapeCsv(inv.user?.mobile),
    escapeCsv(inv.taxableAmount || '0.00'),
    escapeCsv(inv.gstRate || '18.00'),
    escapeCsv(inv.gstAmount || '0.00'),
    escapeCsv(inv.grossAmount || inv.amount || '0.00'),
    escapeCsv(inv.paymentGateway),
    escapeCsv(inv.transactionId),
    escapeCsv(inv.status),
    escapeCsv(inv.invoiceUrl),
  ]);

  const invoicesCsvContent = [invoiceHeaders.join(','), ...invoiceRows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(path.join(backupDir, 'gst-invoices.csv'), invoicesCsvContent, 'utf-8');

  // Generate Payments CSV
  const paymentHeaders = [
    'Payment ID',
    'User ID',
    'Customer Name',
    'Mobile',
    'Amount',
    'Status',
    'Gateway',
    'Transaction ID',
    'Invoice Number',
    'Created At',
  ];

  const paymentRows = payments.map(p => [
    escapeCsv(p.id),
    escapeCsv(p.userId),
    escapeCsv(p.user?.fullName),
    escapeCsv(p.user?.mobile),
    escapeCsv(p.amount),
    escapeCsv(p.status),
    escapeCsv(p.paymentGateway),
    escapeCsv(p.transactionId),
    escapeCsv(p.invoiceNumber),
    escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ''),
  ]);

  const paymentsCsvContent = [paymentHeaders.join(','), ...paymentRows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(path.join(backupDir, 'payments-all.csv'), paymentsCsvContent, 'utf-8');

  console.log(`✅ Backup Completed Successfully!`);
  console.log(`📁 Files Created in: ${backupDir}`);
  console.log(`  - full-database-snapshot.json (${profiles.length} profiles, ${payments.length} payments)`);
  console.log(`  - profiles-all.csv (${profiles.length} rows)`);
  console.log(`  - gst-invoices.csv (${invoices.length} invoices)`);
  console.log(`  - payments-all.csv (${payments.length} records)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
