/**
 * Material Handler Utility Functions
 * Consolidates material-related form handling logic for reuse across components
 */

import { logger } from '@/services/logger'

const materialLogger = logger.child('MaterialHandlers')

export interface MaterialHandlersProps {
  onInputChange: (field: string, value: string | number | undefined) => void
  materialId: string | undefined
  materialQuantity: number | undefined
}

/**
 * Handle material selection changes with logging and validation
 */
export const handleMaterialChange = (
  materialId: string | undefined,
  props: MaterialHandlersProps,
) => {
  const { onInputChange, materialId: currentMaterialId, materialQuantity } = props

  materialLogger.info('handleMaterialChange', 'User changed material in product form', {
    previousMaterialId: currentMaterialId,
    newMaterialId: materialId,
    hasQuantity: !!materialQuantity,
    willClearQuantity: !materialId && !!materialQuantity,
  })

  onInputChange('materialId', materialId)

  // Clear quantity if material is deselected
  if (!materialId && materialQuantity) {
    materialLogger.debug(
      'handleMaterialChange',
      'Clearing material quantity due to material deselection',
    )
    onInputChange('materialQuantity', undefined)
  }
}

/**
 * Handle material quantity changes with validation and logging
 */
export const handleMaterialQuantityChange = (
  quantity: number | undefined,
  props: MaterialHandlersProps,
) => {
  const { onInputChange, materialId, materialQuantity: currentQuantity } = props

  materialLogger.info(
    'handleMaterialQuantityChange',
    'User changed material quantity in product form',
    {
      materialId,
      previousQuantity: currentQuantity,
      newQuantity: quantity,
      hasValidMaterial: !!materialId,
    },
  )

  if (!materialId && quantity) {
    materialLogger.warn(
      'handleMaterialQuantityChange',
      'Quantity provided without material selection',
      {
        quantity,
        materialId,
      },
    )
  }

  onInputChange('materialQuantity', quantity)
}

/**
 * Create material handler functions bound to specific props
 */
export const createMaterialHandlers = (props: MaterialHandlersProps) => ({
  handleMaterialChange: (materialId: string | undefined) =>
    handleMaterialChange(materialId, props),

  handleMaterialQuantityChange: (quantity: number | undefined) =>
    handleMaterialQuantityChange(quantity, props),
})