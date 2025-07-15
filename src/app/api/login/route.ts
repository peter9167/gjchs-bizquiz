import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

// 서버 사이드에서 service role key 사용
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, password } = body

    // 입력 검증
    if (!studentId || !password) {
      return NextResponse.json(
        { error: '학번과 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    if (studentId.length !== 4) {
      return NextResponse.json(
        { error: '학번은 4자리여야 합니다.' },
        { status: 400 }
      )
    }

    // 학번 파싱
    const grade = parseInt(studentId.charAt(0))
    const classNum = parseInt(studentId.charAt(1))
    const number = parseInt(studentId.substring(2))

    // 학생 정보 조회
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('grade', grade)
      .eq('class', classNum)
      .eq('number', number)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { error: '학번을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!student.phone) {
      return NextResponse.json(
        { error: '전화번호가 설정되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 확인 (전화번호 뒷자리 4자리)
    const phoneLastFour = student.phone.slice(-4)
    if (phoneLastFour !== password) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 새 세션 토큰 생성
    const token = uuidv4()
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({ session_token: token })
      .eq('id', student.id)
      .select()
      .single()

    if (updateError || !updatedStudent) {
      return NextResponse.json(
        { error: '로그인 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      token
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}