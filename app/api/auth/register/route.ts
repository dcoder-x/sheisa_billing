import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      entityName,
      registrationNumber,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      businessType,
      subdomain,
      themeColor,
      logoUrl,
      password,
    } = body;


    // Validate required fields
    if (
      !entityName ||
      !registrationNumber ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !postalCode ||
      !country ||
      !businessType ||
      !password
    ) {
      return NextResponse.json(

        {
          message: `Missing required field: ${!entityName ? 'entityName' :
            !registrationNumber ? 'registrationNumber' :
              !email ? 'email' :
                !phone ? 'phone' :
                  !address ? 'address' :
                    !city ? 'city' :
                      !state ? 'state' :
                        !postalCode ? 'postalCode' :
                          !country ? 'country' :
                            !businessType ? 'businessType' :
                              'password'
            }`
        },
        { status: 400 }
      );
    }

    // Check if a PENDING registration request already exists
    const whereConditions: any[] = [
      { registrationNumber },
      { email },
    ];

    if (subdomain) {
      whereConditions.push({ subdomain });
    }

    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        status: 'PENDING',
        OR: whereConditions,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: 'A registration request with this number, email, or subdomain is already pending review' },
        { status: 409 }
      );
    }

    // Check if registration details are taken by an active entity
    const entityWhereConditions: any[] = [
      { registrationNumber },
      { email },
    ];
    if (subdomain) {
      entityWhereConditions.push({ subdomain });
    }

    const existingEntity = await prisma.entity.findFirst({
      where: {
        OR: entityWhereConditions,
      },
    });

    if (existingEntity) {
      return NextResponse.json(
        { message: 'Registration number, email, or subdomain is already registered to an active workspace' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create registration request
    const registrationRequest = await prisma.registrationRequest.create({
      data: {
        entityName,
        registrationNumber,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        country,
        businessType,
        subdomain,
        themeColor,
        logoUrl,
        password: hashedPassword,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      { message: 'Registration request submitted successfully', id: registrationRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
