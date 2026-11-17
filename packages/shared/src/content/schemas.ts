import { z } from 'zod';

/**
 * Schémas zod des fichiers de contenu éditorial (`content/actions.json`, `content/impact-factors.json`).
 * Référence : `content/README.md`. Tous les objets sont stricts (aucun champ supplémentaire).
 */

/** Statut de relecture d'un fichier de contenu. */
export const CONTENT_STATUSES = ['a_valider', 'valide'] as const;
export const contentStatusSchema = z.enum(CONTENT_STATUSES);

/** Domaines du parcours pas à pas. */
export const DOMAINS = ['alimentation', 'quotidien_dechets', 'reparation_reemploi'] as const;
export const domainSchema = z.enum(DOMAINS);
export type Domain = z.infer<typeof domainSchema>;

export const EFFORTS = ['faible', 'moyen'] as const;
export const effortSchema = z.enum(EFFORTS);
export type Effort = z.infer<typeof effortSchema>;

/** `ponctuelle` : se fait une fois ; `habitude` : peut se répéter. */
export const ACTION_KINDS = ['ponctuelle', 'habitude'] as const;
export const actionKindSchema = z.enum(ACTION_KINDS);
export type ActionKind = z.infer<typeof actionKindSchema>;

/** Les 6 catégories de lieux d'Alt. (celles de `linked_category` et de l'import OSM). */
export const PLACE_CATEGORIES = [
  'vrac',
  'producteurs',
  'anti_gaspi',
  'reparation',
  'ressourcerie',
  'collecte',
] as const;
export const placeCategorySchema = z.enum(PLACE_CATEGORIES);
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant au format slug attendu');

export const actionSchema = z.strictObject({
  id: slugSchema,
  domain: domainSchema,
  title: z.string().min(1).max(70),
  body: z.string().min(1).max(400),
  effort: effortSchema,
  kind: actionKindSchema,
  saving_eur_per_occurrence: z.number().min(0),
  saving_basis: z.string().min(1),
  impact_factor_id: slugSchema.nullable(),
  linked_category: placeCategorySchema.nullable(),
});
export type Action = z.infer<typeof actionSchema>;

export const actionsFileSchema = z
  .strictObject({
    status: contentStatusSchema,
    schema_version: z.literal(1),
    actions: z.array(actionSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    file.actions.forEach((action, index) => {
      if (seen.has(action.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['actions', index, 'id'],
          message: `identifiant en double : ${action.id}`,
        });
      }
      seen.add(action.id);
    });
  });
export type ActionsFile = z.infer<typeof actionsFileSchema>;

export const FACTOR_STATUSES = ['verifie_code_source', 'verifie', 'a_verifier'] as const;
export const factorStatusSchema = z.enum(FACTOR_STATUSES);
export type FactorStatus = z.infer<typeof factorStatusSchema>;

const httpsUrlSchema = z.url({ protocol: /^https$/ });

export const factorSchema = z
  .strictObject({
    id: slugSchema,
    label: z.string().min(1),
    value: z.number().positive().nullable(),
    unit: z.string().min(1),
    source_name: z.string().min(1),
    source_url: httpsUrlSchema,
    upstream_source_url: httpsUrlSchema.optional(),
    method: z.string().min(1),
    uncertainty: z.string().min(1),
    version: z.string().nullable(),
    retrieved_at: z.iso.date().nullable(),
    status: factorStatusSchema,
  })
  .refine((factor) => factor.value !== null || factor.status === 'a_verifier', {
    message: 'value ne peut être null que si status vaut a_verifier',
    path: ['value'],
  });
export type Factor = z.infer<typeof factorSchema>;

export const impactFactorsFileSchema = z
  .strictObject({
    status: contentStatusSchema,
    schema_version: z.literal(1),
    notes: z.string(),
    factors: z.array(factorSchema),
    equivalences: z.array(factorSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    const check = (list: 'factors' | 'equivalences') =>
      file[list].forEach((factor, index) => {
        if (seen.has(factor.id)) {
          ctx.addIssue({
            code: 'custom',
            path: [list, index, 'id'],
            message: `identifiant en double : ${factor.id}`,
          });
        }
        seen.add(factor.id);
        const isEq = factor.id.startsWith('eq-');
        if ((list === 'equivalences') !== isEq) {
          ctx.addIssue({
            code: 'custom',
            path: [list, index, 'id'],
            message:
              list === 'equivalences'
                ? `une équivalence doit commencer par « eq- » : ${factor.id}`
                : `seules les équivalences commencent par « eq- » : ${factor.id}`,
          });
        }
      });
    check('factors');
    check('equivalences');
  });
export type ImpactFactorsFile = z.infer<typeof impactFactorsFileSchema>;

/**
 * Règle d'affichage (content/README.md) : un chiffre d'impact n'est montré que si la valeur
 * existe et que le facteur n'est pas « à vérifier ».
 */
export function isFactorUsable(factor: Factor): factor is Factor & { value: number } {
  return factor.value !== null && factor.status !== 'a_verifier';
}
