import dataSource from '../data-source';

async function runSeeds() {
  try {
    await dataSource.initialize();
    console.log('Data source initialized');

    // Add seed runners here
    // await runUserSeeds(dataSource);
    // await runCategorySeeds(dataSource);
    // await runProductSeeds(dataSource);

    console.log('All seeds completed successfully');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

runSeeds();
