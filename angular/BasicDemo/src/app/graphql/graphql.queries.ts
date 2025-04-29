import {gql} from "@apollo/client";

const GetProjects = gql`
query getProjects( $filterByName: String, $orderBy: ProjectOrderEnum, $pageSize: Int = 24, $pageNumber: Int = 0)
{
    getProjects(params: {paging: {pageNumber: $pageNumber, pageSize: $pageSize}, filter: {byProjectName: $filterByName}, orderBy: $orderBy} ) {
          total
          pageSize
          contents {
                ...Project
                __typename
                }
                __typename
              }
          }
          fragment Project on ProjectOutput {
              id
              name
              description
              createdAt
              modifiedAt
          rootFolder {
              id
              __typename
            }
          thumbnailPath
          totalAssets
          projectMembers {
             contents {
                   id
                   userDetails {
                   id
                   email
                   firstName
                   lastName
                   profilePictureUrl
                   accountRole
                   jobTitle
                   companyInfo {
                     id
                     company
                     __typename
                     }
                 __typename
             }
             invitedBy {
               id
               firstName
               lastName
               __typename
               }
           invitedOn
           projectRole
           __typename
           }
           __typename
           }
           ownedBy {
             id
             signedUpAt
             jobTitle
             firstName
             lastName
             profilePictureUrl
             accountRole
             email
             companyInfo {
               id
               company
               __typename
               }
               __typename
               }
               __typename
               }
`
;


const GetFolderContents = gql`query getFolderContents($folderId: ID!, $foldersOrderBy: FolderOrderEnum!, $foldersPageNumber: Int!, $foldersPageSize: Int!, $assetsOrderBy: AssetOrderEnum!, $assetsPageNumber: Int!, $assetsPageOffset: Int!, $assetsPageSize: Int!, $filterByLabels: [ID!], $filterAssetCountByLabels: [ID!]!) {
  getFolderContents: folder(folderId: $folderId) {
    __typename
    ...FilteredFolder
    ...Filesystem
  }
}

fragment FolderTree on FolderOutput {
  isNestingLevelReached
  nestingLevel
  parentFolder {
    nestingLevel
    id
    name
    parentFolder {
      nestingLevel
      id
      name
      parentFolder {
        nestingLevel
        id
        name
        parentFolder {
          nestingLevel
          id
          name
          parentFolder {
            nestingLevel
            id
            name
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment FilteredFolder on FolderOutput {
  id
  modifiedAt
  createdAt
  description
  name
  assetCount(filter: {byLabels: $filterAssetCountByLabels})
  includedFoldersSummary: folders(
    paging: {pageNumber: 0, pageOffset: 0, pageSize: 0}
  ) {
    contents {
      id
      name
      assets(
        filter: {not: {byAssetType: HXCP_PURCHASE}, byLabels: $filterByLabels}
        paging: {pageSize: 10, pageNumber: 0, pageOffset: 0}
      ) {
        total
        __typename
      }
      __typename
    }
    total
    __typename
  }
  includedAssetsSummary: assets(
    paging: {pageSize: 10, pageNumber: 0, pageOffset: 0}
    filter: {not: {byAssetType: HXCP_PURCHASE}, byLabels: $filterByLabels}
  ) {
    appliedFilters {
      byLabels
      __typename
    }
    contents {
      id
      thumbnailPath
      __typename
    }
    total
    __typename
  }
  ...FolderTree
  __typename
}

fragment ProcessingPipeline on ProcessingPipelineInfoOutputV2 {
  processingPipelineId
  name
  __typename
}

fragment GeneratedPipelineArtifact on GeneratedPipelineArtifactInfoOutput {
  status
  inputs {
    type
    path
    __typename
  }
  errorsV2 {
    type
    message
    details
    troubleshooting
    __typename
  }
  __typename
}

fragment AssetArtifactAddress on AddressOutput {
  __typename
  ... on Renderable {
    id
    endpoint
    label
    consumptionType
    serviceType
    __typename
  }
  ... on AddressHspcOutput {
    processingPipelineInfoV2 {
      ...ProcessingPipeline
      __typename
    }
    generatedPipelineArtifactInfo {
      ...GeneratedPipelineArtifact
      __typename
    }
    __typename
  }
  ... on AddressLtsOutput {
    processingPipelineInfoV2 {
      ...ProcessingPipeline
      __typename
    }
    generatedPipelineArtifactInfo {
      ...GeneratedPipelineArtifact
      __typename
    }
    __typename
  }
  ... on AddressCubemapJsonOutput {
    processingPipelineInfoV2 {
      ...ProcessingPipeline
      __typename
    }
    generatedPipelineArtifactInfo {
      ...GeneratedPipelineArtifact
      __typename
    }
    __typename
  }
  ... on AddressOgc3DOutput {
    processingPipelineInfoV2 {
      ...ProcessingPipeline
      __typename
    }
    generatedPipelineArtifactInfo {
      ...GeneratedPipelineArtifact
      __typename
    }
    qualityFactor
    __typename
  }
  ... on AddressDownloadableOutput {
    processingPipelineInfoV2 {
      ...ProcessingPipeline
      __typename
    }
    generatedPipelineArtifactInfo {
      ...GeneratedPipelineArtifact
      __typename
    }
    expirationDate
    label
    __typename
  }
}

fragment AssetArtifact on ArtifactItemOutput {
  id
  dataCategory
  createdAt
  addressesV2 {
    contents {
      ...AssetArtifactAddress
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetTree on GroupedAssetOutput {
  folder {
    id
    name
    isRootFolder
    project {
      id
      rootFolder {
        id
        __typename
      }
      __typename
    }
    parentFolder {
      id
      name
      isRootFolder
      parentFolder {
        id
        name
        isRootFolder
        parentFolder {
          id
          name
          isRootFolder
          parentFolder {
            id
            name
            isRootFolder
            parentFolder {
              id
              name
              isRootFolder
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment Asset on GroupedAssetOutput {
  id
  folder {
    id
    __typename
  }
  assetSize
  name
  thumbnailPath
  createdAt
  modifiedAt
  createdBy {
    id
    email
    firstName
    lastName
    profilePictureUrl
    deleted
    __typename
  }
  assetType
  assetStatus
  downloadLink
  sharingCode
  storageRegion
  asset {
    id
    artifactsV2 {
      contents {
        ...AssetArtifact
        __typename
      }
      __typename
    }
    __typename
  }
  ...AssetTree
  __typename
}

fragment Filesystem on FolderOutput {
  id
  folders(
    orderBy: $foldersOrderBy
    paging: {pageNumber: $foldersPageNumber, pageOffset: 0, pageSize: $foldersPageSize}
  ) {
    contents {
      ...FilteredFolder
      __typename
    }
    total
    appliedPagination {
      pageNumber
      pageOffset
      pageSize
      __typename
    }
    __typename
  }
  assetCount(filter: {byLabels: $filterAssetCountByLabels})
  assets(
    orderBy: $assetsOrderBy
    paging: {pageNumber: $assetsPageNumber, pageOffset: $assetsPageOffset, pageSize: $assetsPageSize}
    filter: {not: {byAssetType: HXCP_PURCHASE}, byLabels: $filterByLabels}
  ) {
    contents {
      ...Asset
      __typename
    }
    total
    appliedPagination {
      pageNumber
      pageOffset
      pageSize
      __typename
    }
    __typename
  }
  __typename
}`

export const HxDrGetAssetDetailsV2 = gql`query getAsset($id: ID!) {
  asset(groupedAssetId: $id) {
    __typename
    ... on GroupedAssetOutput {
      id
      folder {
        id
        project {
          id
          rootFolder {
            id
            __typename
          }
          __typename
        }
        __typename
      }
      ...Asset
      ...AssetWorldPosition
      ...AssetAnnotations
      __typename
    }
  }
}

fragment Asset on GroupedAssetOutput {
  id
  folder {
    id
    __typename
  }
  assetSize
  name
  thumbnailPath
  createdAt
  modifiedAt
  createdBy {
    id
    email
    firstName
    lastName
    profilePictureUrl
    __typename
  }
  assetType
  assetStatus
  downloadLink
  sharingCode
  asset {
    id
    artifactsV2 {
      contents {
        ...AssetArtifact
        __typename
      }
      __typename
    }
    __typename
  }
  ...AssetTree
  __typename
}

fragment AssetArtifact on ArtifactItemOutput {
  id
  dataCategory
  addresses {
    contents {
      ...AssetArtifactAddress
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetArtifactAddress on AddressOutput {
  __typename
  ... on Renderable {
    id
    endpoint
    label
    consumptionType
    serviceType
    __typename
  }
  ... on AddressHspcOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
  ... on AddressLtsOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
  ... on AddressCubemapJsonOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
  ... on AddressOgc3DOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    qualityFactor
    __typename
  }
  ... on AddressDownloadableOutput {
    expirationDate
    label
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
}

fragment ProcessingPipeline on ProcessingPipelineInfoOutput {
  id
  name
  status
  errors {
    type
    __typename
  }
  __typename
}

fragment AssetTree on GroupedAssetOutput {
  folder {
    id
    name
    isRootFolder
    parentFolder {
      id
      name
      isRootFolder
      parentFolder {
        id
        name
        isRootFolder
        parentFolder {
          id
          name
          isRootFolder
          parentFolder {
            id
            name
            isRootFolder
            parentFolder {
              id
              name
              isRootFolder
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetWorldPosition on GroupedAssetOutput {
  asset {
    anchorPoint {
      x
      y
      z
      __typename
    }
    withEmbeddedGeoreference
    referencedBounds {
      cartesianBounds {
        dimensions {
          depth
          width
          height
          __typename
        }
        origin {
          x
          y
          z
          __typename
        }
        __typename
      }
      originGeolocation {
        height
        latitude
        longitude
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetAnnotations on GroupedAssetOutput {
  labelAnnotations {
    ...LabelAnnotation
    __typename
  }
  limitingBoxAnnotations {
    ...LimitingBoxAnnotation
    __typename
  }
  measurementAnnotations {
    ...MeasurementAnnotation
    __typename
  }
  __typename
}

fragment LabelAnnotation on LabelAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    position {
      x
      y
      z
      __typename
    }
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment LimitingBoxAnnotation on LimitingBoxAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    maxX
    maxY
    maxZ
    minX
    minY
    minZ
    offset {
      x
      y
      z
      __typename
    }
    rotation {
      x
      y
      z
      __typename
    }
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment MeasurementAnnotation on MeasurementAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    measurementType
    points {
      x
      y
      z
      __typename
    }
    __typename
  }
  __typename
}`;
const HxDRGetAssetDetails = gql`query getAssetDetails($id: ID!) {
  getAsset(groupedAssetId: $id) {
    ...AssetDetails
    __typename
  }
}

fragment AssetDetails on GroupedAssetOutput {
  id
  folder {
    id
    project {
      id
      projectMembers {
        contents {
          id
          projectRole
          userDetails {
            id
            __typename
          }
          __typename
        }
        __typename
      }
      ownedBy {
        ...AvatarRenderable
        companyInfo {
          id
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
  createdAt
  modifiedAt
  createdBy {
    id
    email
    firstName
    lastName
    profilePictureUrl
    __typename
  }
  name
  assetSize
  thumbnailPath
  assetType
  downloadLink
  georeferences {
    pageNumber
    pageSize
    total
    contents {
      id
      latitude
      longitude
      altitude
      pitch
      yaw
      roll
      anchorX
      anchorY
      anchorZ
      scaleX
      scaleY
      scaleZ
      createdAt
      modifiedAt
      name
      flattenScale
      flattenEnabled
      visible {
        type
        visible
        __typename
      }
      __typename
    }
    __typename
  }
  labelAnnotations {
    ...LabelAnnotation
    __typename
  }
  limitingBoxAnnotations {
    ...LimitingBoxAnnotation
    __typename
  }
  measurementAnnotations {
    ...MeasurementAnnotation
    __typename
  }
  ...AssetProcessingStatus
  ...AssetPreview
  tours {
    contents {
      ...TourRenderable
      __typename
    }
    __typename
  }
  __typename
}

fragment AvatarRenderable on SimpleUserProfileOutput {
  id
  firstName
  lastName
  profilePictureUrl
  accountRole
  email
  __typename
}

fragment LabelAnnotation on LabelAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    position {
      x
      y
      z
      __typename
    }
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment LimitingBoxAnnotation on LimitingBoxAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    maxX
    maxY
    maxZ
    minX
    minY
    minZ
    rotation {
      x
      y
      z
      __typename
    }
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment MeasurementAnnotation on MeasurementAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    measurementType
    points {
      x
      y
      z
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetProcessingStatus on GroupedAssetOutput {
  id
  asset {
    id
    jobSummary {
      jobs {
        type
        state
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetPreview on GroupedAssetOutput {
  id
  asset {
    withEmbeddedGeoreference
    anchorPoint {
      x
      y
      z
      __typename
    }
    artifacts {
      contents {
        type
        addresses {
          contents {
            ... on AddressOgc3DOutput {
              endpoint
              type
              __typename
            }
            ... on AddressHspcOutput {
              endpoint
              type
              __typename
            }
            ... on AddressLtsOutput {
              endpoint
              type
              __typename
            }
            ... on AddressWfsOutput {
              endpoint
              type
              __typename
            }
            ... on AddressWmsOutput {
              endpoint
              type
              __typename
            }
            ... on AddressWmtsOutput {
              endpoint
              type
              __typename
            }
            ... on AddressPanoramicOutput {
              endpoint
              id
              label
              type
              __typename
            }
            ... on AddressDownloadOutput {
              id
              type
              expirationDate
              label
              downloadType
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    files {
      contents {
        files {
          downloadLink
          __typename
        }
        __typename
      }
      __typename
    }
    referencedBounds {
      cartesianBounds {
        origin {
          x
          y
          z
          __typename
        }
        dimensions {
          width
          height
          depth
          __typename
        }
        __typename
      }
      originGeolocation {
        longitude
        latitude
        height
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment TourRenderable on GroupedAssetTourOutput {
  id
  name
  description
  duration
  canEdit
  closed
  tension
  createdAt
  modifiedAt
  createdBy {
    ...UserRenderable
    __typename
  }
  keyframes {
    ...KeyframeRenderable
    __typename
  }
  thumbnailPath
  __typename
}

fragment UserRenderable on SimpleUserProfileOutput {
  id
  firstName
  lastName
  profilePictureUrl
  accountRole
  email
  __typename
}

fragment KeyframeRenderable on GroupedAssetTourKeyframeOutput {
  id
  durationFromTourStart
  tension
  cameraViewpoint {
    ...CameraViewpointRenderable
    __typename
  }
  properties {
    ...PropertiesRenderable
    __typename
  }
  __typename
}

fragment CameraViewpointRenderable on TourCameraViewpointOutput {
  eyePosition {
    ...vectorRenderable
    __typename
  }
  forward {
    ...vectorRenderable
    __typename
  }
  up {
    ...vectorRenderable
    __typename
  }
  __typename
}

fragment vectorRenderable on Vector3Output {
  x
  y
  z
  __typename
}

fragment PropertiesRenderable on GroupedAssetPropertiesOutput {
  selectedLimitingBoxAnnotation
  visibleArtifacts
  visibleLabelAnnotations
  visibleMeasurementAnnotations
  __typename
}`;

const HxDRGetAssetDetailsNew = gql`
query getAsset($id: ID!) {
  asset(groupedAssetId: $id) {
    __typename
    ... on GroupedAssetOutput {
      id
      folder {
        id
        project {
          id
          rootFolder {
            id
            __typename
          }
          __typename
        }
        __typename
      }
      ...Asset
      ...AssetWorldPosition
      ...AssetAnnotations
      __typename
    }
  }
}

fragment Asset on GroupedAssetOutput {
  id
  folder {
    id
    __typename
  }
  assetSize
  name
  thumbnailPath
  createdAt
  modifiedAt
  createdBy {
    id
    email
    firstName
    lastName
    profilePictureUrl
    __typename
  }
  assetType
  assetStatus
  downloadLink
  sharingCode
  asset {
    id
    artifacts {
      contents {
        ...AssetArtifact
        __typename
      }
      __typename
    }
    __typename
  }
  ...AssetTree
  __typename
}

fragment AssetArtifact on ArtifactItemOutput {
  id
  dataCategory
  addresses {
    contents {
      ...AssetArtifactAddress
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetArtifactAddress on AddressOutput {
  __typename
  ... on Renderable {
    id
    endpoint
    label
    consumptionType
    serviceType
    __typename
  }
  ... on AddressHspcOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
  ... on AddressLtsOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
  ... on AddressCubemapJsonOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
  ... on AddressOgc3DOutput {
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    qualityFactor
    __typename
  }
  ... on AddressDownloadableOutput {
    expirationDate
    label
    processingPipelineInfo {
      ...ProcessingPipeline
      __typename
    }
    __typename
  }
}

fragment ProcessingPipeline on ProcessingPipelineInfoOutput {
  id
  name
  status
  errors {
    type
    __typename
  }
  __typename
}

fragment AssetTree on GroupedAssetOutput {
  folder {
    id
    name
    isRootFolder
    parentFolder {
      id
      name
      isRootFolder
      parentFolder {
        id
        name
        isRootFolder
        parentFolder {
          id
          name
          isRootFolder
          parentFolder {
            id
            name
            isRootFolder
            parentFolder {
              id
              name
              isRootFolder
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetWorldPosition on GroupedAssetOutput {
  asset {
    anchorPoint {
      x
      y
      z
      __typename
    }
    withEmbeddedGeoreference
    referencedBounds {
      cartesianBounds {
        dimensions {
          depth
          width
          height
          __typename
        }
        origin {
          x
          y
          z
          __typename
        }
        __typename
      }
      originGeolocation {
        height
        latitude
        longitude
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment AssetAnnotations on GroupedAssetOutput {
  labelAnnotations {
    ...LabelAnnotation
    __typename
  }
  limitingBoxAnnotations {
    ...LimitingBoxAnnotation
    __typename
  }
  measurementAnnotations {
    ...MeasurementAnnotation
    __typename
  }
  __typename
}

fragment LabelAnnotation on LabelAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    position {
      x
      y
      z
      __typename
    }
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment LimitingBoxAnnotation on LimitingBoxAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    maxX
    maxY
    maxZ
    minX
    minY
    minZ
    offset {
      x
      y
      z
      __typename
    }
    rotation {
      x
      y
      z
      __typename
    }
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment MeasurementAnnotation on MeasurementAnnotationOutput {
  id
  modifiedAt
  modifiedBy {
    id
    firstName
    lastName
    __typename
  }
  thumbnailPath
  createdAt
  createdBy {
    id
    firstName
    lastName
    __typename
  }
  title
  description
  data {
    lookAt {
      distance
      pitch
      yaw
      roll
      ref {
        x
        y
        z
        __typename
      }
      __typename
    }
    measurementType
    points {
      x
      y
      z
      __typename
    }
    __typename
  }
  __typename
}
`;


export {
  GetProjects, GetFolderContents, HxDRGetAssetDetails, HxDRGetAssetDetailsNew
}
