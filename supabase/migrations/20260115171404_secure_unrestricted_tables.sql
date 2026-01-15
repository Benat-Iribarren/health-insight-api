-- 1. Habilitar RLS en las tablas UNRESTRICTED
ALTER TABLE public."SecurityLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."biometric_minutes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."context_intervals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."patientnotifications" ENABLE ROW LEVEL SECURITY;

-- 2. SECURITYLOGS: Solo permitir inserción
DROP POLICY IF EXISTS "Allow authenticated insert only" ON public."SecurityLogs";
CREATE POLICY "Allow authenticated insert only"
ON public."SecurityLogs"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. BIOMETRIC_MINUTES: Acceso total para usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated select and insert" ON public."biometric_minutes";
CREATE POLICY "Allow authenticated select and insert"
ON public."biometric_minutes"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. CONTEXT_INTERVALS: Acceso total para usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated select and insert" ON public."context_intervals";
CREATE POLICY "Allow authenticated select and insert"
ON public."context_intervals"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. PATIENTNOTIFICATIONS: Acceso total (incluye DELETE)
DROP POLICY IF EXISTS "Allow authenticated full access" ON public."patientnotifications";
CREATE POLICY "Allow authenticated full access"
ON public."patientnotifications"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);