import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2] || 'cmkz0oeth0000l7044pbd8my9';

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      claimedMembers: {
        include: {
          community: true
        }
      },
      ownedMembers: {
        include: {
          community: true
        }
      },
      communityMemberships: {
        include: {
          community: true
        }
      },
      plan: true
    }
  });

  if (!user) {
    console.log('❌ Usuario no encontrado con ID:', userId);
    return;
  }

  console.log('\n👤 USUARIO ENCONTRADO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ID:', user.id);
  console.log('Nombre:', user.name || '(sin nombre)');
  console.log('Email:', user.email);
  console.log('Creado:', user.createdAt);
  console.log('Plan:', user.plan?.name || '(sin plan)');

  console.log('\n📍 CLAIMED MEMBERS:');
  if (user.claimedMembers?.length > 0) {
    user.claimedMembers.forEach(m => {
      console.log(`  - ${m.community?.name || 'Sin comunidad'} (rol: ${m.role || 'N/A'})`);
    });
  } else {
    console.log('  (Ninguno)');
  }

  console.log('\n📍 OWNED MEMBERS:');
  if (user.ownedMembers?.length > 0) {
    user.ownedMembers.forEach(m => {
      console.log(`  - ${m.community?.name || 'Sin comunidad'} (rol: ${m.role || 'N/A'})`);
    });
  } else {
    console.log('  (Ninguno)');
  }

  console.log('\n🏘️ MEMBRESÍAS EN ROWI COMMUNITIES:');
  if (user.communityMemberships?.length > 0) {
    user.communityMemberships.forEach(m => {
      console.log(`  - ${m.community?.name || 'Sin comunidad'} (rol: ${m.role || 'N/A'})`);
    });
  } else {
    console.log('  (No pertenece a ninguna RowiCommunity)');
  }

  // También buscar todas las comunidades disponibles
  const communities = await prisma.rowiCommunity.findMany({
    select: { id: true, name: true, slug: true }
  });

  console.log('\n📋 COMUNIDADES DISPONIBLES PARA ASIGNAR:');
  if (communities.length > 0) {
    communities.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id}, slug: ${c.slug || 'N/A'})`);
    });
  } else {
    console.log('  (No hay comunidades creadas aún)');
  }
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
