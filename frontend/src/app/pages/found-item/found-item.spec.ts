import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoundItem } from './found-item';

describe('FoundItem', () => {
  let component: FoundItem;
  let fixture: ComponentFixture<FoundItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoundItem],
    }).compileComponents();

    fixture = TestBed.createComponent(FoundItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
