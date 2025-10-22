const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment')
  process.exit(1)
}

const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  const studentId = 5 // Pedro López según seed

  const enrollRes = await sb
    .from('enrollments')
    .select('subject_id, subjects(id, name, description, teacher_id)')
    .eq('student_id', studentId)

  const gradesRes = await sb
    .from('grades')
    .select('id, assignment_id, subject_id, score')
    .eq('student_id', studentId)

  console.log('ENROLLMENTS RESULT:')
  console.log(JSON.stringify(enrollRes, null, 2))
  console.log('\nGRADES RESULT:')
  console.log(JSON.stringify(gradesRes, null, 2))
}

run().catch((err) => {
  console.error('Query failed', err)
  process.exit(1)
})
