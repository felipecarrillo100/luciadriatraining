import {gql} from "@apollo/client";

export const GetProjectsV2 = gql`
query getProjects($filterByName: String, $filterByOwner: ID, $orderBy: ProjectsOrderEnum, $pageSize: Int = 24, $pageNumber: Int = 0) {
  projectsV2(
    params: {pagination: {pageNumber: $pageNumber, pageSize: $pageSize}, filter: {byProjectName: $filterByName, byOwnedBy: $filterByOwner}, orderBy: $orderBy}
  ) {
    __typename
    ... on ProjectsResultOutput {
      total
      contents {
        ...Project
        __typename
      }
      __typename
    }
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
        deleted
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
        deleted
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
    deleted
    companyInfo {
      id
      company
      __typename
    }
    __typename
  }
  latitude
  longitude
  projectSize
  __typename
}
`;

export const GetFolderContents = gql`query getFolderContents($folderId: ID!, $foldersOrderBy: FolderOrderEnum!, $foldersPageNumber: Int!, $foldersPageSize: Int!, $assetsOrderBy: AssetOrderEnum!, $assetsPageNumber: Int!, $assetsPageOffset: Int!, $assetsPageSize: Int!, $filterByLabels: [ID!], $filterAssetCountByLabels: [ID!]!) {
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
      __typename
    }
  }
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
}`;
