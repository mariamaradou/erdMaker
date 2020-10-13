import {
  stageWidth,
  stageHeight,
  entityWidth,
  entityHeight,
  relationshipWidth,
  relationshipHeight,
  attributeRadiusX,
  attributeRadiusY,
  extensionRadius,
  labelMinWidth,
  labelMinHeight,
  labelMaxWidth,
  labelMaxHeight,
} from "../global/constants";

import { getChildren } from "../global/utils";

const initialState = {
  entities: [],
  relationships: [],
  attributes: [],
  extensions: [],
  labels: [],
  count: 0, // Total number of components created in a single diagram (includes deleted).
  // Never decreases and new ids depend on it
};

const componentsReducer = (state = initialState, action) => {
  var newState = {};
  Object.assign(newState, state);
  var childrenList = [];
  const stage = document.querySelector(".stage");
  switch (action.type) {
    case "ADD_ENTITY":
      return {
        ...state,
        entities: [
          ...state.entities,
          {
            id: state.count + 1,
            name: "<New>" + (state.count + 1),
            x: stage.scrollLeft + window.innerWidth / 2,
            y: stage.scrollTop + window.innerHeight / 2,
            type: "regular",
            connectionCount: 0, // Number of connections
          },
        ],
        count: state.count + 1,
      };
    case "UPDATE_POSITION_ENTITY":
      return {
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === action.payload.id ? { ...entity, x: action.payload.x, y: action.payload.y } : entity
        ),
      };
    case "SET_NAME_ENTITY":
      return {
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === action.payload.id ? { ...entity, name: action.payload.name } : entity
        ),
      };
    case "SET_TYPE_ENTITY":
      return {
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === action.payload.id ? { ...entity, type: action.payload.type } : entity
        ),
      };
    case "DELETE_ENTITY":
      return {
        ...state,
        entities: state.entities.filter((entity) => entity.id !== action.payload.id),
        attributes: state.attributes.filter((attribute) => attribute.parentId !== action.payload.id),
        extensions: state.extensions.filter((extension) => extension.parentId !== action.payload.id),
      };
    case "ADD_EXTENSION":
      return {
        ...state,
        extensions: [
          ...state.extensions,
          {
            id: state.count + 1,
            parentId: action.payload.id,
            text: "",
            x: action.payload.x,
            y: action.payload.y,
            type: "undefined",
            participation: "partial",
            cardinality: "disjoint",
            connections: [],
            //connectionCount: 0, // Number of connections
          },
        ],
        count: state.count + 1,
      };
    case "UPDATE_POSITION_EXTENSION":
      return {
        ...state,
        extensions: state.extensions.map((extension) =>
          extension.id === action.payload.id ? { ...extension, x: action.payload.x, y: action.payload.y } : extension
        ),
      };
    case "MODIFY_EXTENSION":
      for (let i in newState.extensions) {
        if (newState.extensions[i].id === action.payload.id) {
          newState.extensions[i] = {
            ...newState.extensions[i],
            [action.payload.prop]: action.payload.value,
          };
          break;
        }
      }
      return newState;
    case "DELETE_EXTENSION":
      return {
        ...state,
        extensions: state.extensions.filter((extension) => extension.id !== action.payload.id),
      };
    case "ADD_RELATIONSHIP":
      return {
        ...state,
        relationships: [
          ...state.relationships,
          {
            id: state.count + 1,
            name: "<New>" + (state.count + 1),
            x: stage.scrollLeft + window.innerWidth / 2,
            y: stage.scrollTop + window.innerHeight / 2,
            type: {
              weak: false,
            },
            connections: [],
          },
        ],
        count: state.count + 1,
      };
    case "UPDATE_POSITION_RELATIONSHIP":
      return {
        ...state,
        relationships: state.relationships.map((relationship) =>
          relationship.id === action.payload.id
            ? { ...relationship, x: action.payload.x, y: action.payload.y }
            : relationship
        ),
      };
    case "SET_NAME_RELATIONSHIP":
      return {
        ...state,
        relationships: state.relationships.map((relationship) =>
          relationship.id === action.payload.id ? { ...relationship, name: action.payload.name } : relationship
        ),
      };
    case "SET_TYPE_RELATIONSHIP":
      for (let i in newState.relationships) {
        if (newState.relationships[i].id === action.payload.id) {
          newState.relationships[i].type = {
            ...newState.relationships[i].type,
            [action.payload.type]: !newState.relationships[i].type[action.payload.type],
          };
          break;
        }
      }
      return newState;
    case "DELETE_RELATIONSHIP":
      // Reduce connectionCount of involved entities
      function adjustEntities(connection) {
        for (let j in newState.entities) {
          if (newState.entities[j].id === connection.connectId) newState.entities[j].connectionCount--;
        }
      }
      for (let i in newState.relationships) {
        if (newState.relationships[i].id === action.payload.id)
          newState.relationships[i].connections.forEach(adjustEntities);
      }
      newState.relationships = newState.relationships.filter((relationship) => relationship.id !== action.payload.id);
      return newState;
    case "ADD_CONNECTION":
      return {
        ...state,
        relationships: state.relationships.map((relationship) =>
          relationship.id === action.payload.id
            ? {
                ...relationship,
                connections: [
                  ...relationship.connections,
                  {
                    id: state.count + 1,
                    parentId: action.payload.id,
                    connectId: 0,
                    min: "",
                    max: "",
                    exactMin: "",
                    exactMax: "",
                    role: "",
                  },
                ],
              }
            : relationship
        ),
        count: state.count + 1,
      };
    case "CHANGE_CONNECTION": // Change connected entity
      var prevConnectId = 0;
      for (let i in newState.relationships) {
        if (newState.relationships[i].id === action.payload.parentId)
          for (let j in newState.relationships[i].connections) {
            if (newState.relationships[i].connections[j].id === action.payload.id) {
              prevConnectId = newState.relationships[i].connections[j].connectId;
              newState.relationships[i].connections[j] = {
                ...newState.relationships[i].connections[j],
                connectId: action.payload.connectId,
              };
            }
          }
      }
      for (let i in newState.entities) {
        if (newState.entities[i].id === prevConnectId)
          newState.entities[i] = {
            ...newState.entities[i],
            connectionCount: newState.entities[i].connectionCount - 1,
          };
        if (newState.entities[i].id === action.payload.connectId)
          newState.entities[i] = {
            ...newState.entities[i],
            connectionCount: newState.entities[i].connectionCount + 1,
          };
      }
      return newState;
    case "MODIFY_CONNECTION":
      for (let i in newState.relationships) {
        if (newState.relationships[i].id === action.payload.parentId)
          for (let j in newState.relationships[i].connections) {
            if (newState.relationships[i].connections[j].id === action.payload.id) {
              newState.relationships[i].connections[j] = {
                ...newState.relationships[i].connections[j],
                [action.payload.prop]: action.payload.value,
              };
              break;
            }
          }
      }
      return newState;
    case "DELETE_CONNECTION":
      if (action.payload.id) {
        for (let i in newState.entities) {
          if (newState.entities[i].id === action.payload.connectId)
            newState.entities[i] = {
              ...newState.entities[i],
              connectionCount: newState.entities[i].connectionCount - 1,
            };
        }
        for (let i in newState.relationships) {
          if (newState.relationships[i].id === action.payload.parentId)
            newState.relationships[i].connections = newState.relationships[i].connections.filter(
              (connection) => connection.id !== action.payload.id
            );
        }
        return newState;
      } else {
        for (let i in newState.relationships) {
          newState.relationships[i].connections = newState.relationships[i].connections.filter(
            (connection) => connection.connectId !== action.payload.connectId
          );
        }
        return newState;
      }
    case "ADD_ATTRIBUTE":
      return {
        ...state,
        attributes: [
          ...state.attributes,
          {
            id: state.count + 1,
            parentId: action.payload.id,
            name: "<New>" + (state.count + 1),
            x: action.payload.x,
            y: action.payload.y,
            type: {
              unique: false,
              multivalued: false,
              optional: false,
              composite: false,
              derived: false,
            },
          },
        ],
        count: state.count + 1,
      };
    case "UPDATE_POSITION_ATTRIBUTE":
      return {
        ...state,
        attributes: state.attributes.map((attribute) =>
          attribute.id === action.payload.id ? { ...attribute, x: action.payload.x, y: action.payload.y } : attribute
        ),
      };
    case "SET_NAME_ATTRIBUTE":
      return {
        ...state,
        attributes: state.attributes.map((attribute) =>
          attribute.id === action.payload.id ? { ...attribute, name: action.payload.name } : attribute
        ),
      };
    case "SET_TYPE_ATTRIBUTE":
      for (let i in newState.attributes) {
        if (newState.attributes[i].id === action.payload.id) {
          newState.attributes[i].type = {
            ...newState.attributes[i].type,
            [action.payload.type]: !newState.attributes[i].type[action.payload.type],
          };
          break;
        }
      }
      return newState;
    case "DELETE_ATTRIBUTE":
      return {
        ...state,
        attributes: state.attributes.filter((attribute) => attribute.id !== action.payload.id),
      };
    case "DELETE_CHILDREN":
      getChildren(childrenList, state.attributes, action.payload.id); // Retrieve children of component with provided id
      return {
        ...state,
        attributes: state.attributes.filter((attribute) => !childrenList.includes(attribute.id)),
      };
    case "UPDATE_POSITION_CHILDREN": // Moves children along with parent component
      getChildren(childrenList, state.attributes, action.payload.id); // Retrieve children of component with provided id
      return {
        ...state,
        attributes: state.attributes.map((attribute) =>
          childrenList.includes(attribute.id)
            ? {
                ...attribute,
                x: attribute.x + action.payload.dx,
                y: attribute.y + action.payload.dy,
              }
            : attribute
        ),
      };
    case "ADD_LABEL":
      return {
        ...state,
        labels: [
          ...state.labels,
          {
            id: state.count + 1,
            text: "<New>" + (state.count + 1),
            x: stage.scrollLeft + window.innerWidth / 2,
            y: stage.scrollTop + window.innerHeight / 2,
            width: labelMinWidth,
            height: labelMinHeight,
          },
        ],
        count: state.count + 1,
      };
    case "UPDATE_POSITION_LABEL":
      return {
        ...state,
        labels: state.labels.map((label) =>
          label.id === action.payload.id ? { ...label, x: action.payload.x, y: action.payload.y } : label
        ),
      };
    case "SET_TEXT_LABEL":
      return {
        ...state,
        labels: state.labels.map((label) =>
          label.id === action.payload.id ? { ...label, text: action.payload.text } : label
        ),
      };
    case "RESIZE_LABEL":
      return {
        ...state,
        labels: state.labels.map((label) =>
          label.id === action.payload.id
            ? {
                ...label,
                width:
                  action.payload.width < labelMinWidth
                    ? labelMinWidth
                    : action.payload.width > labelMaxWidth
                    ? labelMaxWidth
                    : action.payload.width,
                height:
                  action.payload.height < labelMinHeight
                    ? labelMinHeight
                    : action.payload.height > labelMaxHeight
                    ? labelMaxHeight
                    : action.payload.height,
              }
            : label
        ),
      };
    case "DELETE_LABEL":
      return {
        ...state,
        labels: state.labels.filter((label) => label.id !== action.payload.id),
      };
    case "REPOSITION_COMPONENTS": // Used to return all components within stage bound if dragged off
      for (let i in newState.entities) {
        if (newState.entities[i].x > stageWidth - entityWidth / 2)
          newState.entities[i].x = stageWidth - entityWidth / 2;
        else if (newState.entities[i].x < entityWidth / 2) newState.entities[i].x = entityWidth / 2;
        if (newState.entities[i].y > stageHeight - entityHeight / 2)
          newState.entities[i].y = stageHeight - entityHeight / 2;
        else if (newState.entities[i].y < entityHeight / 2) newState.entities[i].y = entityHeight / 2;
      }
      for (let i in newState.relationships) {
        if (newState.relationships[i].x > stageWidth - relationshipWidth)
          newState.relationships[i].x = stageWidth - relationshipWidth;
        else if (newState.relationships[i].x < relationshipWidth) newState.relationships[i].x = relationshipWidth;
        if (newState.relationships[i].y > stageHeight - relationshipHeight)
          newState.relationships[i].y = stageHeight - relationshipHeight;
        else if (newState.relationships[i].y < relationshipHeight) newState.relationships[i].y = relationshipHeight;
      }
      for (let i in newState.attributes) {
        if (newState.attributes[i].x > stageWidth - attributeRadiusX)
          newState.attributes[i].x = stageWidth - attributeRadiusX;
        else if (newState.attributes[i].x <= attributeRadiusX) newState.attributes[i].x = attributeRadiusX;
        if (newState.attributes[i].y > stageHeight - attributeRadiusY)
          newState.attributes[i].y = stageHeight - attributeRadiusY;
        else if (newState.attributes[i].y <= attributeRadiusY) newState.attributes[i].y = attributeRadiusY;
      }
      for (let i in newState.extensions) {
        if (newState.extensions[i].x > stageWidth - extensionRadius)
          newState.extensions[i].x = stageWidth - extensionRadius;
        else if (newState.extensions[i].x <= extensionRadius) newState.extensions[i].x = extensionRadius;
        if (newState.extensions[i].y > stageHeight - extensionRadius)
          newState.extensions[i].y = stageHeight - extensionRadius;
        else if (newState.extensions[i].y <= extensionRadius) newState.extensions[i].y = extensionRadius;
      }
      for (let i in newState.labels) {
        if (newState.labels[i].x > stageWidth - newState.labels[i].width / 2)
          newState.labels[i].x = stageWidth - newState.labels[i].width / 2;
        else if (newState.labels[i].x < newState.labels[i].width / 2)
          newState.labels[i].x = newState.labels[i].width / 2;
        if (newState.labels[i].y > stageHeight - newState.labels[i].height / 2)
          newState.labels[i].y = stageHeight - newState.labels[i].height / 2;
        else if (newState.labels[i].y < newState.labels[i].height / 2)
          newState.labels[i].y = newState.labels[i].height / 2;
      }
      return newState;
    case "SET_COMPONENTS":
      return action.payload;
    case "RESET_COMPONENTS":
      return initialState;
    default:
      return state;
  }
};

export default componentsReducer;
