import { connectToDB } from "../../../../lib/mongo" ;
import User from '../../../../models/User';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  await connectToDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) return NextResponse.json({ error: 'User exists' }, { status: 400 });

  const hashedPassword = await hash(password, 10);

  const user = new User({ email, password: hashedPassword });
  await user.save();

  return NextResponse.json({ message: 'User created' }, { status: 201 });
}