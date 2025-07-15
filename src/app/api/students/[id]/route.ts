import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching student:', error)
      return NextResponse.json(
        { error: '학생 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      student
    })
  } catch (error) {
    console.error('Student GET API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, grade, class: studentClass, number } = body

    const { data: student, error } = await supabase
      .from('students')
      .update({
        name,
        grade: grade ? parseInt(grade) : undefined,
        class: studentClass ? parseInt(studentClass) : undefined,
        number: number ? parseInt(number) : undefined
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating student:', error)
      return NextResponse.json(
        { error: '학생 정보 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      student
    })
  } catch (error) {
    console.error('Student PUT API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting student:', error)
      return NextResponse.json(
        { error: '학생 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '학생이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Student DELETE API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}