// Note: Unit test CategoryService - TDD, co-location
import { CategoryService } from './categoryService'

describe('CategoryService', () => {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any
  let service: CategoryService

  beforeEach(() => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        count: jest.fn(),
      },
    }
    service = new CategoryService(prisma)
    jest.clearAllMocks()
  })

  it('should return list of categories', async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'cat1',
        name: 'Cat',
        color: '#FFF',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [],
      },
    ])
    const result = await service.getCategories()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should return category detail by id', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat1',
      name: 'Cat',
      color: '#FFF',
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      products: [],
    })
    const result = await service.getCategoryById('cat1')
    expect(result?.id).toBe('cat1')
  })

  it('should create category with valid data', async () => {
    const data = { name: 'NewCat', color: '#123456' }
    prisma.category.findUnique.mockResolvedValue(null) // name unique
    prisma.category.create.mockResolvedValue({
      ...data,
      id: 'cat2',
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      products: [],
    })
    const result = await service.createCategory(data, 'user1')
    expect(result.name).toBe('NewCat')
  })

  it('should not create category with duplicate name', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'cat1', name: 'Dup' })
    await expect(
      service.createCategory({ name: 'Dup', color: '#123456' }, 'user1'),
    ).rejects.toThrow()
  })

  it('should update category with valid data', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'cat1', name: 'Cat' })
    prisma.category.update.mockResolvedValue({
      id: 'cat1',
      name: 'Updated',
      color: '#FFF',
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      products: [],
    })
    const result = await service.updateCategory('cat1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })

  it('should not update non-existent category', async () => {
    prisma.category.findUnique.mockResolvedValue(null)
    await expect(service.updateCategory('999', { name: 'X' })).rejects.toThrow()
  })

  it('should delete category if not in use', async () => {
    prisma.product.count.mockResolvedValue(0)
    prisma.category.delete.mockResolvedValue({ id: 'cat2' })
    const result = await service.deleteCategory('cat2')
    expect(result).toBe(true)
  })

  it('should not delete category if in use', async () => {
    prisma.product.count.mockResolvedValue(1)
    await expect(service.deleteCategory('cat1')).rejects.toThrow()
  })

  it('should validate unique category name', async () => {
    prisma.category.findUnique.mockResolvedValue(null)
    const isUnique = await service.validateCategoryName('Unique')
    expect(isUnique).toBe(true)
  })

  it('should check if category is in use', async () => {
    prisma.product.count.mockResolvedValue(2)
    const inUse = await service.isCategoryInUse('cat1')
    expect(inUse).toBe(true)
  })

  it('should throw validation error for invalid data', async () => {
    await expect(service.createCategory({ name: '', color: 'red' }, 'user1')).rejects.toThrow()
  })
})
