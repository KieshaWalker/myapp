import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI')
MONGODB_DB = os.getenv('MONGODB_DB', 'myapp')

async def main():
    if not MONGODB_URI:
        raise SystemExit('Set MONGODB_URI in environment')
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB]
    docs = [
        { 'name': 'Drink water', 'notes': '8 cups', 'createdAt': datetime.utcnow() },
        { 'name': 'Walk 10 minutes', 'notes': '', 'createdAt': datetime.utcnow() },
    ]
    await db.habits.insert_many(docs)
    print('Seeded habits:', [d['name'] for d in docs])
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
