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
    const { grade, class: classNum, number, name, phone } = body

    // 입력 검증
    if (!grade || !classNum || !number || !name || !phone) {
      return NextResponse.json(
        { error: '모든 필수 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 토큰 생성
    const token = uuidv4()

    // 기존 학생 확인 (중복 체크)
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('*')
      .eq('grade', parseInt(grade))
      .eq('class', parseInt(classNum))
      .eq('number', parseInt(number))
      .maybeSingle()

    if (checkError) {
      console.error('Student check error:', checkError)
      return NextResponse.json(
        { error: '학생 정보 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 기존 학생이 있다면 세션 토큰만 업데이트
    if (existingStudent) {
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          session_token: token,
          name: name.trim(),
          phone: phone.trim()
        })
        .eq('id', existingStudent.id)
        .select()
        .single()

      if (updateError) {
        console.error('Student update error:', updateError)
        return NextResponse.json(
          { error: '학생 정보 업데이트에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        student: updatedStudent,
        token,
        message: '기존 학생 정보로 로그인되었습니다.'
      })
    }

    // 새 학생 등록
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        grade: parseInt(grade),
        class: parseInt(classNum),
        number: parseInt(number),
        name: name.trim(),
        phone: phone.trim(),
        session_token: token
      })
      .select()
      .single()

    if (studentError) {
      console.error('Student registration error:', studentError)
      return NextResponse.json(
        { error: '학생 등록에 실패했습니다: ' + studentError.message },
        { status: 500 }
      )
    }

    // 초기 포트폴리오 생성
    const { error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        student_id: student.id,
        virtual_assets: 1000000,
        total_return_rate: 0.00
      })

    if (portfolioError) {
      console.error('Portfolio creation error:', portfolioError)
      // 포트폴리오 생성 실패해도 학생 등록은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      student,
      token
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}