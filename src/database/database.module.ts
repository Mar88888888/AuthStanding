import { Module } from '@nestjs/common';
import { db } from '../db/drizzle.provider';

@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useValue: db,
    },
  ],
  exports: ['DRIZZLE'],
})
export class DatabaseModule {}
