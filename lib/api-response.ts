import { NextResponse } from 'next/server';

export function success(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}
