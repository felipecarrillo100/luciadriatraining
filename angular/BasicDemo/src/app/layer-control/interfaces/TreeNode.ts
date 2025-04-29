import {LayerTypesEnum} from "./LayerTypesEnum";

interface TreeNode {
  label: string;
  id: string;
  type: LayerTypesEnum;
  children: TreeNode[];
  properties: {
    visible: boolean;
    selectable?:boolean;
    transparency?: boolean;
    labels?: boolean;
    collapsed: boolean;
  }
}

export {
  TreeNode
}
