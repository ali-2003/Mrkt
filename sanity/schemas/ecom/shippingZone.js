// schemas/shippingZone.js
export default {
    name: 'shippingZone',
    title: 'Shipping Zone',
    type: 'document',
    fields: [
      {
        name: 'state',
        title: 'State/Province',
        type: 'string',
        description: 'Indonesian state/province name'
      },
      {
        name: 'stateCode',
        title: 'State Code',
        type: 'string',
        description: 'Short code for the state (e.g., JK for Jakarta)'
      },
      {
        name: 'shippingCost',
        title: 'Shipping Cost',
        type: 'number',
        description: 'Shipping cost in Rupiah'
      },
      {
        name: 'estimatedDays',
        title: 'Estimated Delivery Days',
        type: 'string',
        description: 'Estimated delivery time (e.g., "2-3 days")'
      },
      {
        name: 'isActive',
        title: 'Is Active',
        type: 'boolean',
        initialValue: true
      }
    ],
    preview: {
      select: {
        title: 'state',
        subtitle: 'shippingCost'
      },
      prepare(selection) {
        const {title, subtitle} = selection
        return {
          title: title,
          subtitle: subtitle ? `Rp ${subtitle.toLocaleString()}` : 'No shipping cost set'
        }
      }
    }
  }