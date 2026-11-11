import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LostItem } from './lost-item';

describe('LostItem', () => {
  let component: LostItem;
  let fixture: ComponentFixture<LostItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LostItem],
    }).compileComponents();

    fixture = TestBed.createComponent(LostItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
