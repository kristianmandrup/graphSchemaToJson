/// <reference path="../index.d.ts"/>

import * as consts from './consts'
import * as graphql from 'graphql/type'

export const getType = (field) => {
    return field.astNode.type.name
}

export const filterByDirective = (name, fields) =>
    Object.keys(fields).reduce((filteredFields, fieldKey) => {
        const field = fields[fieldKey]
        if (field.astNode.directives) {
            if (field.astNode.directives.find(directive => directive.name.value === name)) {
                return {...filteredFields, [fieldKey]: fields[fieldKey]}
            }
        }
        return filteredFields
    }, {})

/**
 * @param {object} directive
 * @return {Object.<string, any>}
 */
export const convertDirectiveArguments = (directive) => {
    if (directive.arguments) {
        return directive.arguments.reduce((obj, arg) => ({
            ...obj,
            [arg.name.value]: arg.value.value
        }), {})
    }

    return {}
}

/**
 * 
 * @param {graphql.GraphQLNamedType | graphql.GraphQLField | graphql.GraphQLEnumType} type
 * @return {Object.<string, Directive>}
 */
export const convertDirectives = (type) => {
    switch (type.constructor.name) {

    case consts.GRAPHQL_ENUM_TYPE:
        if (type.astNode) {
            return type.astNode.directives.reduce((directives, directive) => ({
                ...directives,
                [directive.name.value]: convertDirectiveArguments(directive)
            }), {})
        }
        return {}
    case consts.OBJECT:
        if (type.astNode) {
            return type.astNode.directives.reduce((directives, directive) => ({
                ...directives,
                [directive.name.value]: convertDirectiveArguments(directive)
            }), {})
        }
        return {}

    case consts.GRAPHQL_OBJECT_TYPE:
        if (type.astNode) {
            return type.astNode.directives.reduce((directives, directive) => ({
                ...directives,
                [directive.name.value]: convertDirectiveArguments(directive)
            }), {})
        }
        return {}
        
    default:
        console.log('convertDirectives unhandled: ', type.constructor.name)
        return {}
    }
}

export const normalizeType = (type) => {
    const map = {
        String: 'string',
        Int: 'number',
        Float: 'float',
    }

    return map[type] ? map[type] : type
}
/**
 * @param {graphql.GraphQLField<any, any>} field
 * @return {Field}
 */
export const convertField = (field) => {
    const getNonNullable = (field) => {
        if (field.astNode) {
            return field.astNode.type.kind !== consts.NON_NULL_TYPE
        }
        return true
    }

    const getIsList = (field) => {
        if (field.astNode) {
            if (field.astNode.type.kind === consts.LIST_TYPE) {
                return true
            } else if (field.astNode.type.kind === consts.NON_NULL_TYPE) {
                if (field.astNode.type.type.kind === consts.LIST_TYPE) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        }
        return false
    }
    /**
     * @param {graphql.GraphQLField} field 
     */
    const getType = (field) => {
        if (field.astNode) {
            if (field.astNode.type.kind === consts.LIST_TYPE) {
                return field.astNode.type.type.name.value
            } else if (field.astNode.type.kind === consts.NON_NULL_TYPE) {
                if (field.astNode.type.type.kind === consts.LIST_TYPE) {
                    return field.astNode.type.type.type.name.value
                } else {
                    return field.astNode.type.type.name.value
                }
            } else {
                return field.astNode.type.name.value
            }
        }
        return field.type.toString
    }
    
    switch (field.constructor.name) {

    case consts.OBJECT:
        return {
            type: getType(field),
            directives: convertDirectives(field),
            isNullable: getNonNullable(field),
            isList: getIsList(field)
        }
    default:
        console.log('convertField unhandled type: ', field.constructor.name)
        return {}
    }
}
/**
 * @param {Object.<string, graphql.GraphQLField>} fields
 * @return {Object.<string, Field>}
 */
export const convertFields = (fields) =>
    Object.keys(fields).reduce((newFields, fieldKey) => ({
        ...newFields,
        [fieldKey]: convertField(fields[fieldKey])
    }), {})
/**
 * @param {graphql.GraphQLObjectType} type
 * @return {Type}
 */
export const convertObjectType = (type) => ({
    fields: convertFields(type.getFields()),
    directives: convertDirectives(type),
    type: consts.OBJECT
})
/**
 * @function
 * @param {graphql.GraphQLEnumType} enumType
 * @returns {Enum}
 */
export const convertEnumType = (enumType) => ({
    fields: enumType.getValues().map(val => val.name),
    directives: convertDirectives(enumType),
    type: consts.ENUM
})
/**
 * @function
 * @param {Object.<string, graphql.GraphQLNamedType>} typeMap
 * @returns {Object.<string, Type | Enum>}
 */
export const convertTypeMap = (typeMap) => {
    
    const newTypeMap = {}
    
    Object.keys(typeMap).forEach(typeKey => {
        switch (typeMap[typeKey].constructor.name) {

        case consts.GRAPHQL_ENUM_TYPE:
            newTypeMap[typeKey] = convertEnumType(/** @type {graphql.GraphQLEnumType} */(typeMap[typeKey]))
            break
        case consts.GRAPHQL_OBJECT_TYPE:
            newTypeMap[typeKey] = convertObjectType(/** @type {graphql.GraphQLObjectType} */(typeMap[typeKey]))
            break
        default:
            console.log(typeMap[typeKey].constructor.name)
        }
    })
    return newTypeMap
}
/**
 * @param {graphql.GraphQLSchema} schema
 * @returns {JSSchema}
 */
export const schemaToJS = (schema) => convertTypeMap(schema.getTypeMap())