 

## Setup Authenticated Flow untuk Multiple Roles (Kasir, Producer, Owner)

Tidak, Anda tidak perlu menghapus setup 'authenticate' flow yang sudah ada. Sebaliknya, Anda perlu membuat multiple auth state files untuk setiap role yang berbeda.

### 1. Modifikasi Global Setup untuk Multiple Roles

**Buat setup terpisah untuk setiap role di global.setup.ts:**

```typescript
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

setup('global setup', async ({}) => {
  await clerkSetup()
})

// Setup untuk role Kasir
const kasirAuthFile = path.join(__dirname, '../playwright/.clerk/kasir.json')
setup('authenticate kasir and save state', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_KASIR_USERNAME!,
      password: process.env.E2E_KASIR_PASSWORD!,
    },
  })
  await page.goto('/kasir/dashboard')
  await page.waitForSelector("h1:has-text('Kasir Dashboard')")
  await page.context().storageState({ path: kasirAuthFile })
})

// Setup untuk role Producer  
const producerAuthFile = path.join(__dirname, '../playwright/.clerk/producer.json')
setup('authenticate producer and save state', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_PRODUCER_USERNAME!,
      password: process.env.E2E_PRODUCER_PASSWORD!,
    },
  })
  await page.goto('/producer/dashboard')
  await page.waitForSelector("h1:has-text('Producer Dashboard')")
  await page.context().storageState({ path: producerAuthFile })
})

// Setup untuk role Owner
const ownerAuthFile = path.join(__dirname, '../playwright/.clerk/owner.json')
setup('authenticate owner and save state', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_OWNER_USERNAME!,
      password: process.env.E2E_OWNER_PASSWORD!,
    },
  })
  await page.goto('/owner/dashboard')
  await page.waitForSelector("h1:has-text('Owner Dashboard')")
  await page.context().storageState({ path: ownerAuthFile })
})
```
 [(1)](https://clerk.com/docs/testing/playwright/test-authenticated-flows) 

### 2. Update Playwright Config untuk Multiple Projects

**Modifikasi playwright.config.ts:**

```typescript
projects: [
  {
    name: 'global setup',
    testMatch: /global\.setup\.ts/,
  },
  {
    name: 'Kasir tests',
    testMatch: /.*kasir.spec.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.clerk/kasir.json',
    },
    dependencies: ['global setup'],
  },
  {
    name: 'Producer tests', 
    testMatch: /.*producer.spec.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.clerk/producer.json',
    },
    dependencies: ['global setup'],
  },
  {
    name: 'Owner tests',
    testMatch: /.*owner.spec.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.clerk/owner.json',
    },
    dependencies: ['global setup'],
  },
]
```


### 3. Buat Directory Storage

**Update .gitignore dan buat directory:**

```bash
mkdir -p playwright/.clerk
echo $'\nplaywright/.clerk' >> .gitignore
```


### 4. Environment Variables untuk Multiple Roles

**Tambahkan di .env.local:**

```bash
# Kasir credentials
E2E_KASIR_USERNAME=kasir@example.com
E2E_KASIR_PASSWORD=password123

# Producer credentials  
E2E_PRODUCER_USERNAME=producer@example.com
E2E_PRODUCER_PASSWORD=password123

# Owner credentials
E2E_OWNER_USERNAME=owner@example.com
E2E_OWNER_PASSWORD=password123
```

### 5. Test Files untuk Setiap Role

**kasir.spec.ts:**
```typescript
import { test } from '@playwright/test'

test.use({ storageState: 'playwright/.clerk/kasir.json' })

test('kasir can access kasir dashboard', async ({ page }) => {
  await page.goto('/kasir/dashboard')
  await page.waitForSelector("text='Kasir Dashboard'")
})

test('kasir cannot access owner dashboard', async ({ page }) => {
  await page.goto('/owner/dashboard')
  await page.waitForSelector("text='Access Denied'")
})
```


**producer.spec.ts:**
```typescript
import { test } from '@playwright/test'

test.use({ storageState: 'playwright/.clerk/producer.json' })

test('producer can access producer dashboard', async ({ page }) => {
  await page.goto('/producer/dashboard')
  await page.waitForSelector("text='Producer Dashboard'")
})
```


**owner.spec.ts:**
```typescript
import { test } from '@playwright/test'

test.use({ storageState: 'playwright/.clerk/owner.json' })

test('owner can access all dashboards', async ({ page }) => {
  await page.goto('/owner/dashboard')
  await page.waitForSelector("text='Owner Dashboard'")
  
  await page.goto('/kasir/dashboard')
  await page.waitForSelector("text='Kasir Dashboard'")
})
```


## List Dokumentasi Relevan

Berdasarkan dokumentasi yang tersedia, berikut adalah dokumentasi yang relevan untuk setup multiple roles:

1. **[Test authenticated flows](https://clerk.com/docs/testing/playwright/test-authenticated-flows)** - Panduan lengkap untuk menyimpan dan memuat auth state dengan `storageState`

2. **[Roles and permissions](https://clerk.com/docs/organizations/roles-permissions#roles)**  [(2)](https://clerk.com/docs/organizations/roles-permissions#roles)  - Dokumentasi tentang custom roles seperti `org:admin`, `org:member`, dan cara membuat custom roles

3. **[SignIn](https://clerk.com/docs/references/javascript/sign-in#methods)**  [(3)](https://clerk.com/docs/references/javascript/sign-in#methods)  - API reference untuk `signIn.create()` method yang digunakan dalam testing

4. **[Custom flows](https://clerk.com/docs/custom-flows/overview#how-authentication-flows-work-in-clerk)**  [(4)](https://clerk.com/docs/custom-flows/overview#how-authentication-flows-work-in-clerk)  - Memahami bagaimana authentication flows bekerja dengan `SignIn` object