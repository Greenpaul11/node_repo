
export const DIALECTS = ['mysql', 'postgres', 'mariadb', 'sqlite', 'oracle'] as const

export const DIALECTS_SEQUELIZE = ['mysql', 'postgres', 'mariadb', 'sqlite'] as const
export const ORM_MAP = {
    'sequelize': DIALECTS_SEQUELIZE
} as const
export const ORMS = ['sequelize'] as const 