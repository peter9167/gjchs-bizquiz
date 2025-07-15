import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 이 경로는 동적으로 렌더링되어야 함
export const dynamic = 'force-dynamic'

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

// 통합된 관리자 API - GET 요청
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const id = searchParams.get('id')
    
    switch (resource) {
      case 'questions':
        return id ? await getQuestionById(id) : await getQuestions(searchParams)
      case 'schedules':
        return id ? await getScheduleById(id) : await getSchedules(searchParams)
      case 'students':
        return id ? await getStudentById(id) : await getStudents(searchParams)
      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 통합된 관리자 API - POST 요청
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    
    switch (resource) {
      case 'questions':
        return await createQuestion(request)
      case 'schedules':
        return await createSchedule(request)
      case 'students':
        return await createStudent(request)
      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 통합된 관리자 API - PUT 요청
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required for updates' }, { status: 400 })
    }
    
    switch (resource) {
      case 'questions':
        return await updateQuestion(id, request)
      case 'schedules':
        return await updateSchedule(id, request)
      case 'students':
        return await updateStudent(id, request)
      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 통합된 관리자 API - DELETE 요청
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 })
    }
    
    switch (resource) {
      case 'questions':
        return await deleteQuestion(id)
      case 'schedules':
        return await deleteSchedule(id)
      case 'students':
        return await deleteStudent(id)
      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// Questions handlers
async function getQuestions(searchParams: URLSearchParams) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: '문제 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, questions: data })
}

async function getQuestionById(id: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching question:', error)
    return NextResponse.json({ error: '문제 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, question: data })
}

async function createQuestion(request: NextRequest) {
  const questionData = await request.json()
  
  const { data, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single()

  if (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: '문제 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, question: data })
}

async function updateQuestion(id: string, request: NextRequest) {
  const questionData = await request.json()
  
  const { data, error } = await supabase
    .from('questions')
    .update(questionData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: '문제 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, question: data })
}

async function deleteQuestion(id: string) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: '문제 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Schedules handlers
async function getSchedules(searchParams: URLSearchParams) {
  const { data, error } = await supabase
    .from('quiz_schedules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: '스케줄 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, schedules: data })
}

async function getScheduleById(id: string) {
  const { data, error } = await supabase
    .from('quiz_schedules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: '스케줄 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, schedule: data })
}

async function createSchedule(request: NextRequest) {
  const scheduleData = await request.json()
  
  const { data, error } = await supabase
    .from('quiz_schedules')
    .insert(scheduleData)
    .select()
    .single()

  if (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: '스케줄 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, schedule: data })
}

async function updateSchedule(id: string, request: NextRequest) {
  const scheduleData = await request.json()
  
  const { data, error } = await supabase
    .from('quiz_schedules')
    .update(scheduleData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: '스케줄 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, schedule: data })
}

async function deleteSchedule(id: string) {
  const { error } = await supabase
    .from('quiz_schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: '스케줄 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Students handlers
async function getStudents(searchParams: URLSearchParams) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: '학생 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, students: data })
}

async function getStudentById(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: '학생 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, student: data })
}

async function createStudent(request: NextRequest) {
  const studentData = await request.json()
  
  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single()

  if (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: '학생 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, student: data })
}

async function updateStudent(id: string, request: NextRequest) {
  const studentData = await request.json()
  
  const { data, error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: '학생 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, student: data })
}

async function deleteStudent(id: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: '학생 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}