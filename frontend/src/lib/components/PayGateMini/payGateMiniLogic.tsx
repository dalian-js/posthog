import { actions, connect, kea, key, path, props, selectors } from 'kea'
import { billingLogic } from 'scenes/billing/billingLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature, BillingProductV2AddonType, BillingProductV2Type } from '~/types'

import type { payGateMiniLogicType } from './payGateMiniLogicType'

export interface PayGateMiniLogicProps {
    featureKey: AvailableFeature
    currentUsage?: number
}

export type GateVariantType = 'add-card' | 'contact-sales' | 'move-to-cloud' | null

export const payGateMiniLogic = kea<payGateMiniLogicType>([
    props({} as PayGateMiniLogicProps),
    path(['lib', 'components', 'payGateMini', 'payGateMiniLogic']),
    key((props) => props.featureKey),
    connect(() => ({
        values: [
            billingLogic,
            ['billing', 'billingLoading'],
            userLogic,
            ['user', 'hasAvailableFeature', 'availableFeature'],
            preflightLogic,
            ['isCloudOrDev'],
        ],
        actions: [],
    })),
    actions({
        setGateVariant: (gateVariant: GateVariantType) => ({ gateVariant }),
    }),
    selectors(({ values, props }) => ({
        productWithFeature: [
            (s) => [s.billing],
            (billing) => {
                // TODO(@zach): revisit this logic after subscribe to all products is released
                // There are some features where we want to check the product first
                const checkProductFirst = [AvailableFeature.ORGANIZATIONS_PROJECTS]

                let foundProduct: BillingProductV2Type | BillingProductV2AddonType | undefined = undefined

                if (checkProductFirst.includes(props.featureKey)) {
                    foundProduct = billing?.products?.find((product) =>
                        product.features?.some((f) => f.key === props.featureKey)
                    )
                }

                // Check addons first (if not included in checkProductFirst) since their features are rolled up into the parent
                const allAddons = billing?.products?.map((product) => product.addons).flat() || []
                if (!foundProduct) {
                    foundProduct = allAddons.find((addon) => addon.features?.some((f) => f.key === props.featureKey))
                }

                if (!foundProduct) {
                    foundProduct = billing?.products?.find((product) =>
                        product.features?.some((f) => f.key === props.featureKey)
                    )
                }
                return foundProduct
            },
        ],
        isAddonProduct: [
            (s) => [s.billing, s.productWithFeature],
            (billing, productWithFeature) =>
                billing?.products?.some((product) =>
                    product.addons?.some((addon) => addon.type === productWithFeature?.type)
                ),
        ],
        featureInfo: [
            (s) => [s.productWithFeature],
            (productWithFeature) => productWithFeature?.features.find((f) => f.key === props.featureKey),
        ],
        featureAvailableOnOrg: [
            (s) => [s.user, (_, props) => props.featureKey],
            (_user, featureKey) => {
                return values.availableFeature(featureKey)
            },
        ],
        minimumPlanWithFeature: [
            (s) => [s.productWithFeature],
            (productWithFeature) =>
                productWithFeature?.plans.find((plan) => plan.features?.some((f) => f.key === props.featureKey)),
        ],
        nextPlanWithFeature: [
            (s) => [s.productWithFeature],
            (productWithFeature) => {
                const currentPlanIndex = productWithFeature?.plans.findIndex((plan) => plan.current_plan)
                if (!currentPlanIndex) {
                    return null
                }
                return productWithFeature?.plans[currentPlanIndex + 1]
            },
        ],
        featureInfoOnNextPlan: [
            (s) => [s.nextPlanWithFeature],
            (nextPlanWithFeature) => nextPlanWithFeature?.features.find((f) => f.key === props.featureKey),
        ],
        gateVariant: [
            (s) => [
                s.billingLoading,
                s.hasAvailableFeature,
                s.minimumPlanWithFeature,
                (_, props) => props.featureKey,
                (_, props) => props.currentUsage,
            ],
            (billingLoading, hasAvailableFeature, minimumPlanWithFeature, featureKey, currentUsage) => {
                if (hasAvailableFeature(featureKey, currentUsage)) {
                    return null
                }
                if (billingLoading) {
                    return null
                }
                if (values.isCloudOrDev) {
                    if (!minimumPlanWithFeature || minimumPlanWithFeature.contact_support) {
                        return 'contact-sales'
                    }
                    return 'add-card'
                }
                return 'move-to-cloud'
            },
        ],
    })),
])
