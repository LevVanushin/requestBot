import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://loyzjofbowboxfjwwjak.supabase.co'
const supabasePublishableKey = 'sb_publishable_mo_sMjyiBVbmANtWG0heKw_2sMC9hZ1'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)